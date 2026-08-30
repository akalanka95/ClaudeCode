# Adaptive Interview Prep System

An interview-prep knowledge map: create Topics (Java, Spring Boot, Kafka, ...), connect them on
a node-graph whiteboard, drill into each Topic's own map of Subtopics recursively, and attach
free-text Details/notes to any Topic. Everything persists.

Phase 1 scope only — no auth, no cloud deployment, no rich content authoring (handwriting/OCR/
imports are future phases), no AI features, no multi-user, no undo/redo, no search. Don't add
these without the user asking; they're deliberately deferred.

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
- `docker-compose.yml` — local Postgres only (`interviewprep`/`interviewprep`/`interviewprep`
  on `localhost:5432`).

## Running locally

See `README.md` for the three-step run (Postgres via Docker, `./mvnw spring-boot:run`,
`npm run dev`).
