# Adaptive Interview Prep System

An interview-prep knowledge map: create Topics (Java, Spring Boot, Kafka, ...), connect them on
a node-graph whiteboard, drill into each Topic's own board of Subtopics, and attach free-text
Details, a sticky-note board, and reference links to any Topic. Everything persists. Drilling
into a Topic goes one level deep in the UI: a root-board Topic opens its own graph of Subtopics,
and a Subtopic opens a dedicated page (Details/sticky notes/Sync/References) rather than a
further nested graph — see `ARCHITECTURE.md`'s frontend rules for why.

The original Phase 1 scope (board/topics/details only — no auth, cloud deployment, AI features,
or search) has since been extended: auth (hardcoded `admin` account + Google OAuth, data scoped
per user), cloud deployment (see `DEPLOYMENT.md`), AI features (subtopic Sync web search,
handwritten/PDF note-upload summarization, a mock-interview simulator), and semantic search are
all implemented — see `README.md`'s "What's implemented" for the current feature list. Still
explicitly deferred: undo/redo, and real-time multi-user collaboration on the same board (auth
separates data per account; it doesn't add shared/live editing of one board). Don't add these
without the user asking.

**Before implementing anything — a new feature, a bug fix, any code change — read
`ARCHITECTURE.md`.** It holds the backend/frontend implementation rules and the mandatory
requirement-intake workflow (read requirement → read architecture → find affected modules →
identify API changes → identify DB changes → write a plan → wait for approval). This applies
whenever a requirement is described in conversation, not only when `/new-requirement` is used
explicitly.

**When a bug is reported — in conversation, or via `/bug-report`** — follow the workflow in
`.claude/commands/bug-report.md`: reproduce with real evidence before trusting a code read, match
the literal gesture/sequence the user hit, check library defaults explicitly, grep every
construction site when a shared type's shape changes, and never run mutating automated tests
against live/shared data by fragile selectors (e.g. "last DOM element") — target by ID, use
disposable data, or ask first.

Full design rationale for the original Phase 1 build lives in
`C:\Users\User\.claude\plans\here-planning-to-build-cosmic-sunbeam.md` (data model tradeoffs,
API design, milestone order) — background reading, not a substitute for `ARCHITECTURE.md`.

## Project layout

- `backend/` — Spring Boot 4 (Java 17, Maven, wrapper included — no separate Maven install
  needed). REST API at `/api/v1`. PostgreSQL via Spring Data JPA; schema in
  `backend/src/main/resources/db/migration/`.
- `frontend/` — React 19 + TypeScript + Vite. Canvas is React Flow (`@xyflow/react`); data
  fetching via TanStack Query; routing via React Router; styling via Tailwind v4 (CSS-based
  config, no `tailwind.config.js` — see `src/index.css`).
- `sync-agent/` — small Node/Express service (Claude Agent SDK) the backend calls for the Sync
  and note-upload-summarization features; optional, billed against a Claude Code subscription.
- `docker-compose.yml` — Postgres (`interviewprep`/`interviewprep`/`interviewprep` on
  `localhost:5432`) and Qdrant (the vector store for semantic search) for local dev; can also
  build and run the backend + frontend together (`docker compose up --build`).

## Running locally

See `README.md` for the full local run steps (Postgres + Qdrant via Docker, `./mvnw
spring-boot:run`, the optional `sync-agent` sidecar, `npm run dev`).
