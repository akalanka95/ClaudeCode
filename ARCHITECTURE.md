# Architecture & Implementation Rules

This is the source of truth for how backend and frontend code in this repo must be structured.
Read it in full before implementing anything — not only when explicitly told to, and not only
via `/new-requirement`. If a change would violate a rule here, flag that instead of silently
working around it.

## Backend rules (Spring Boot, `backend/src/main/java/com/interviewprep/backend`)

- **Package-by-domain**, not layer-by-tech: `auth/`, `board/`, `common/`, `config/`, `edge/`,
  `interview/`, `node/`, `noteblock/`, `noteupload/`, `reference/`, `search/`, `sync/`. A new
  domain gets its own package with the same internal shape (entity, repository, service,
  controller, `dto/`), not a new folder under a shared `controllers/`/`services/` tree.
- **Ownership scoping goes through `auth/OwnershipGuard`.** Only `Board.ownerId` and
  `InterviewSession.ownerId` are actual owner columns; every other table (node, edge, note block,
  note upload, reference material, sync run) is scoped transitively through `board_id` or
  `node_id -> board_id`. Add a new `isXOwnedBy` check there rather than querying `owner_id`
  directly on a table that doesn't have one, and don't add an `owner_id` column to a table that
  can already be scoped transitively.
- **A background job that calls an external service (the `sync-agent` sidecar, Anthropic/Voyage)
  follows the Sync/NoteUpload pattern**: a status entity with `PENDING`/`RUNNING`/`COMPLETED`/
  `FAILED`, a controller that saves the `PENDING` row and returns immediately, and an `@Async`
  runner (its own named executor bean in `config/AsyncConfig`) that flips it to `RUNNING`, does
  the slow call, and saves the terminal state. The initial save must happen **outside** any
  `@Transactional` block and commit before the async dispatch — see the comments in
  `SubtopicSyncService.triggerSync` and `NoteUploadService.triggerSummarize` — otherwise the
  background thread can query for the row before the enclosing transaction commits it, find
  nothing, and the run gets stuck at `PENDING` forever. Each save inside the runner is its own
  short transaction for the same reason: wrapping the whole runner in one `@Transactional` hides
  the `RUNNING` update from polling GET requests for as long as the external call takes.
- **Optional AI integrations must not block startup.** `config/AiConfig`'s chat/embedding/Qdrant
  beans are all `@Lazy` because building the Anthropic/Voyage clients validates the API key
  eagerly and connecting to Qdrant is a real network call; none of that should run before these
  optional, metered credentials are known to be configured. This mirrors how the `sync-agent`
  sidecar is optional: the rest of the app works without it, and only the dependent feature
  (Sync, note-upload summarization, semantic search) fails at request time until it's set up.
- **Entities use plain UUID FK columns** (e.g. `Node.boardId`, `Board.parentNodeId`) — no
  bidirectional JPA `@ManyToOne`/`@OneToMany` relationship mappings. This is intentional because
  `Board` and `Node` reference each other circularly; don't "clean this up" into a relationship
  mapping without discussing it first.
- **DTOs are Java records** in a `dto/` subpackage per domain, one record per request/response
  shape (see `node/dto/*`). Controllers never return or accept entities directly.
- **Services own `@Transactional` boundaries**; controllers stay thin — validate path/body via
  `@Valid`, delegate to a service method, map the result to a DTO.
- **Errors**: services throw `NotFoundException` / `ConflictException` / `IllegalArgumentException`
  (`common/`). `common/ApiExceptionHandler` is the *only* place that translates exceptions into
  the `{error, message}` JSON body — never let a raw exception or stack trace reach the client,
  and never add ad-hoc try/catch-and-format logic in a controller.
- **Schema changes are always a new Flyway migration**: `db/migration/V{n}__description.sql`.
  Never edit a migration that has already shipped (i.e. already committed) — add a new one, even
  for a one-column fix. `spring.jpa.hibernate.ddl-auto` stays `validate`; never switch it to
  `update`.
- **REST conventions**: base path `/api/v1`; resource-oriented URLs; `PATCH` for partial updates;
  `201 Created` on create, `204 No Content` on delete, `404` for missing resources, `409` for
  conflicts (e.g. duplicate edge), `400` for validation failures.
- **Checklist for a new backend capability**: migration (if schema changes) → entity field(s) →
  repository method → DTO(s) → service method (with `@Transactional` if it mutates) → controller
  endpoint.

## Frontend rules (React + Vite + TypeScript, `frontend/src`)

- **Folder-by-feature**: `api/` (thin fetch wrappers per backend domain), `hooks/` (TanStack
  Query wrappers around the `api/` functions), `pages/` (route-level components), `components/
  <feature>/` (presentational/interactive pieces used by a page).
- **React Flow's local `nodes`/`edges` state is the source of truth for the visible board**
  (see `BoardCanvas.tsx`), seeded from the board query on load/navigation. Mutations patch that
  local state directly on success rather than invalidating/refetching the whole board — keep
  this pattern for new node/edge mutations; only fall back to invalidation for changes that
  restructure the tree (e.g. delete, which `useNodeMutations`'s `deleteNode` already does).
- **`types/api.ts` is mirrored 1:1 with backend DTOs.** Any backend DTO field addition, rename,
  or removal must be reflected here in the *same* change. This was missed twice during Phase 1
  (`BreadcrumbItem.boardId`, `NodeResponse.detailsContent`) — treat "did I update `types/api.ts`
  and the relevant `api/*.ts` function?" as a mandatory check whenever a backend DTO changes.
- **Styling is Tailwind utility classes inline.** Don't introduce CSS modules, styled-components,
  or a component library without discussing it first.
- **Auth gates routing, not individual fetches**: every route except `/login` and
  `/oauth/callback` sits under `<RequireAuth>` in `App.tsx`, which checks for a stored JWT
  (`api/authToken.ts`, `localStorage`) and `useCurrentUser()` (`hooks/useAuth.ts`) and redirects
  to `/login` otherwise. `api/client.ts` attaches the stored token to every request; don't
  duplicate auth checks inside individual pages/components.
- **"Subtopic board" is a frontend-only distinction, not a backend flag**: `BoardCanvas.tsx`
  computes `isSubtopicBoard = board.parentNode !== null`, i.e. any board that isn't the root. A
  Topic on the root board opens its child board as another graph (`/board/:childBoardId`,
  "Open map"); a Topic that's already on a subtopic board instead opens `/node/:nodeId/subtopic`
  ("Open subtopic") — a dedicated page with a sticky-note board, Details, Sync, and Reference
  Materials, not a further nested graph. This caps the graph-drilling UI at two levels even
  though the backend still creates a child board for every `TOPIC` node regardless of depth (see
  the data model invariant below) — don't assume "no further nesting" is enforced server-side.
- **Checklist for a new frontend capability**: update `types/api.ts` → add/update an `api/`
  function → add/update a hook if the data is cached or reused → build the component/page →
  wire it into `App.tsx` routing if it's a new page (inside `<RequireAuth>` unless it must be
  reachable while logged out).

## Data model invariants

- **Topics and Subtopics are the same entity (`Node`)** at different depths — a self-referencing
  tree via mutual `Board <-> Node` foreign keys. Each `Board` optionally has a `parent_node_id`;
  each `TOPIC`-type `Node` owns exactly one `child_board_id`. `NOTE`-type nodes are free-floating
  annotations sharing the same table, discriminated by `type`, with no children.
- **Creating a Topic node is a two-step insert**, not a deferred FK (see
  `NodeService.createNode`): the node is persisted first with `childBoardId = null`, then its
  child board is created referencing the now-existing node id, then the node is updated to point
  at that board. This avoids the circular-FK chicken-and-egg problem. Keep this pattern if you
  touch node creation — don't "simplify" it into a single insert. This happens unconditionally
  for every `TOPIC` node, including ones on a subtopic board that the frontend will never
  navigate into as a graph (see the frontend rule above) — don't special-case it away by depth.
- **NoteBlock, ReferenceMaterial, and NoteUpload are keyed by `node_id`, not `board_id`**, and are
  independent of the Board/Node graph tree — they're per-Topic attachments (a sticky-note board,
  saved links, and AI-summarized uploads respectively), not additional graph nodes. They cascade
  on their owning node's deletion the same way Boards do.
- **Deleting a Node cascades** (DB-level `ON DELETE CASCADE` on `board.parent_node_id ->
  node.id`) through its child Board and everything nested under it, recursively. Edges
  referencing a deleted node cascade too. Don't add application-level recursive-delete logic —
  the DB already does it.
- **Edges are scoped to a single Board** — never cross-board — and reference two Nodes on that
  board, with one documented exception: a subtopic board's read-only parent-topic anchor (see
  `BoardResponse.parentNode`) lives on a different board (the one the parent node owns), and
  `EdgeService.createEdge` explicitly allows an edge's source/target to be that exact parent node
  id even though it isn't one of this board's own nodes. This is a narrow, explicit carve-out for
  that one relationship — not a general cross-board edge feature; don't extend it to allow
  arbitrary other-board node ids.

## Requirement intake workflow

Follow this whenever a new feature or requirement is described — in conversation, or via
`/new-requirement`. Do not start writing code before step 7.

1. **Read the requirement** as given. Ask clarifying questions if it's genuinely ambiguous about
   scope, UX, or data shape — don't guess on anything that materially changes the design.
2. **Read this file in full** before proposing anything, even if you think you remember it.
3. **Find affected modules**: search the codebase for every backend domain package and frontend
   feature folder the requirement touches. Say explicitly which ones.
4. **Identify API changes**: new or changed endpoints, request/response shape changes — and, for
   every backend DTO change, the matching `frontend/src/types/api.ts` and `api/*.ts` updates
   required (per the mirroring rule above).
5. **Identify DB changes**: new Flyway migration(s) needed, entity field changes, and any cascade
   or constraint implications given the data model invariants above.
6. **Generate an implementation plan**: concrete list of files to touch and in what order. No
   code yet.
7. **Wait for approval.** If already in Plan Mode, use `ExitPlanMode` to request it. Otherwise,
   present the plan in full and explicitly ask for a go-ahead before touching any file.
8. **Create a feature branch off `development`** before making any changes, and commit the
   implementation there — never directly on `development`. See `CONTRIBUTING.md` for the
   branching strategy (naming, merge steps, when to merge back).
