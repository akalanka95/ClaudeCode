# Adaptive Interview Prep System

Phase 1: create topics, connect them on a node-graph map, drill into subtopics recursively,
and attach plain-text details/notes to any topic. Everything persists to Postgres via a
Spring Boot API.

## Stack

- **Backend**: Spring Boot 4 (Java 17, Maven), Spring Data JPA, Flyway, PostgreSQL.
- **Frontend**: React 19 + TypeScript + Vite, React Flow (`@xyflow/react`) for the map canvas,
  TanStack Query for data fetching, React Router for drill-down navigation, Tailwind CSS.

## Running locally

Requires: Java 17+ (bundled Maven Wrapper, no separate Maven install needed), Node.js/npm,
and either Docker or a local PostgreSQL instance.

1. **Database**
   ```
   docker compose up -d
   ```
   This starts Postgres on `localhost:5432` with database `interviewprep` /
   user `interviewprep` / password `interviewprep` (see `docker-compose.yml`).
   If you'd rather use a local Postgres install, create a database and credentials matching
   `backend/src/main/resources/application.yml`.

2. **Backend** (from `backend/`)

   Set an `ANTHROPIC_API_KEY` environment variable (used by the subtopic Sync feature to call
   Claude's web search tool via Spring AI) before starting the backend:
   ```
   export ANTHROPIC_API_KEY=sk-ant-...
   ./mvnw spring-boot:run
   ```
   (On Windows PowerShell: `$env:ANTHROPIC_API_KEY = "sk-ant-..."; .\mvnw.cmd spring-boot:run`.)
   Flyway runs the schema migration automatically on startup. The API serves on
   `http://localhost:8080/api/v1`. The backend will still start without the key set, but Sync
   requests will fail.

3. **Frontend** (from `frontend/`)
   ```
   npm install
   npm run dev
   ```
   Serves on `http://localhost:5173`, configured (via `.env`) to call the backend above.

Open `http://localhost:5173` — it resolves the root board and lands you on the top-level map.

## What's implemented (Phase 1)

- Create/rename/delete Topic and Note nodes on a board; drag to reposition (persisted).
- Connect nodes with edges; delete edges.
- Click a Topic to drill into its own board of subtopics — recursively, to any depth — with a
  breadcrumb trail back up.
- A "Details" view per Topic for free-text notes.
- A subtopic page's Sync button, which uses Claude's web search (via Spring AI) to fetch and
  summarize recent developments related to that topic, with a visible history per subtopic.

Explicitly out of scope for this phase: authentication, cloud deployment, rich content
authoring (handwriting/OCR/imports), further AI features beyond subtopic Sync, multi-user
collaboration, undo/redo, search.
See `backend`/`frontend` source for structure; package-by-domain on the backend
(`board/`, `node/`, `edge/`, `common/`, `config/`), feature folders on the frontend
(`api/`, `hooks/`, `components/board/`, `pages/`).

## Contributing

See `CONTRIBUTING.md` for the git branching strategy (`development` is the base branch; one
feature/fix branch per requirement, merged back once tested).
