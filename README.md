# Adaptive Interview Prep System

Phase 1: create topics, connect them on a node-graph map, drill into subtopics recursively,
and attach plain-text details/notes to any topic. Everything persists to Postgres via a
Spring Boot API.

**Live demo**: _add your deployed URL here once you've followed `DEPLOYMENT.md`_.

## Stack

- **Backend**: Spring Boot 4 (Java 17, Maven), Spring Data JPA, Flyway, PostgreSQL.
- **Frontend**: React 19 + TypeScript + Vite, React Flow (`@xyflow/react`) for the map canvas,
  TanStack Query for data fetching, React Router for drill-down navigation, Tailwind CSS.
- **sync-agent**: a small Node service (Express + `@anthropic-ai/claude-agent-sdk`) that the
  backend calls internally to run the subtopic Sync feature's web search, billed against your
  Claude Code subscription rather than a separate Anthropic API account.
- **Semantic search**: LangChain4j inside the backend (Anthropic + Voyage AI, metered API keys)
  indexes Topic/Subtopic/Note content into Qdrant for the search bar.

## Running locally

Requires: Java 17+ (bundled Maven Wrapper, no separate Maven install needed), Node.js 18+/npm,
and either Docker or a local PostgreSQL instance.

1. **Database + vector store**
   ```
   docker compose up -d postgres qdrant
   ```
   This starts Postgres on `localhost:5432` (database/user/password `interviewprep`) and Qdrant
   on `localhost:6334` (gRPC, used by the backend) / `localhost:6333` (REST, its dashboard) — see
   `docker-compose.yml`. If you'd rather use local installs, create a Postgres database matching
   `backend/src/main/resources/application.yml`, and point `APP_QDRANT_HOST`/
   `APP_QDRANT_GRPC_PORT` at your own Qdrant instance.

2. **Backend** (from `backend/`)
   ```
   ./mvnw spring-boot:run
   ```
   (On Windows: `.\mvnw.cmd spring-boot:run`.) Flyway runs the schema migration automatically
   on startup. The API serves on `http://localhost:8080/api/v1`.

   Semantic search is optional, like `sync-agent` below: the rest of the app works without it,
   and it stays inert until you set `ANTHROPIC_API_KEY` and `VOYAGE_API_KEY` (metered keys, not
   the Claude Code subscription `sync-agent` uses) — without them, search requests fail rather
   than blocking startup.

   **Never put real keys in `application.yml`** — it's committed to git. Put them in
   `backend/.env` instead (gitignored, one `KEY=value` per line — see
   `backend/.env.example`), then export it into your shell before running `spring-boot:run`
   (Spring Boot doesn't read `.env` files on its own):
   ```
   export $(grep -v '^#' backend/.env | xargs)
   ./mvnw spring-boot:run
   ```
   Once set, backfill the index once with
   `curl -X POST http://localhost:8080/api/v1/search/reindex`. If you're on Voyage AI's free
   tier without a payment method on file, its rate limit is a very low 3 requests/minute — a
   bulk reindex of more than a couple of nodes will hit `429`s partway through. Add a payment
   method at the [Voyage dashboard](https://dashboard.voyageai.com/) (free tokens still apply)
   before relying on this for anything beyond a quick smoke test.

3. **sync-agent** (from `sync-agent/`) — powers the subtopic Sync button; the rest of the app
   works without it, but Sync requests will fail until it's running.
   ```
   npm install
   cp .env.example .env
   ```
   Put a Claude Code OAuth token in `.env` (`CLAUDE_CODE_OAUTH_TOKEN=...`, from running
   `claude setup-token`). If you're already logged into Claude Code on this machine, the token
   can be left blank — it falls back to your existing CLI login. Then:
   ```
   npm start
   ```
   Listens on `http://127.0.0.1:4100` (localhost only). Each Sync click spawns a real `claude`
   CLI subprocess, so requests take noticeably longer than a direct API call.

4. **Frontend** (from `frontend/`)
   ```
   npm install
   npm run dev
   ```
   Serves on `http://localhost:5173`, configured (via `.env`) to call the backend above.

Open `http://localhost:5173` — it resolves the root board and lands you on the top-level map.

### Run with Docker

```
docker compose up --build
```

Brings up Postgres, Qdrant, the backend, and the frontend together (`http://localhost:5173`) with
no manual Maven/npm steps. The Sync feature is disabled in this build (see `DEPLOYMENT.md`); the
`sync-agent` sidecar still needs to be run manually if you want it. Semantic search works in this
build if `ANTHROPIC_API_KEY`/`VOYAGE_API_KEY` are set in your shell before running the command
(passed through to the `backend` service — see `docker-compose.yml`); otherwise search requests
fail and everything else works normally. See `DEPLOYMENT.md` for deploying this to free-tier
hosting for a live demo link.

## What's implemented (Phase 1)

- Create/rename/delete Topic and Note nodes on a board; drag to reposition (persisted).
- Connect nodes with edges; delete edges.
- Click a Topic to drill into its own board of subtopics — recursively, to any depth — with a
  breadcrumb trail back up.
- A "Details" view per Topic for free-text notes.
- A subtopic page's Sync button, which uses Claude's web search (via the `sync-agent` sidecar
  and the Claude Agent SDK) to fetch and summarize recent developments related to that topic,
  with a visible history per subtopic.

## What's implemented (Phase 2, in progress)

- Semantic search (search bar in the top nav): Topic/Subtopic labels, Details content, Note
  text, and note-block content are embedded (Voyage AI) into Qdrant via LangChain4j as they're
  created/edited, and searched by meaning rather than exact text. Optional — see "Semantic
  search" above.
- A mock-interview multi-agent simulator (Interviewer/Grader/Coach agents) is planned next; not
  yet built.

Explicitly out of scope for Phase 1: authentication, cloud deployment, rich content
authoring (handwriting/OCR/imports), further AI features beyond subtopic Sync, multi-user
collaboration, undo/redo, search.
See `backend`/`frontend` source for structure; package-by-domain on the backend
(`board/`, `node/`, `edge/`, `common/`, `config/`), feature folders on the frontend
(`api/`, `hooks/`, `components/board/`, `pages/`).

## Contributing

See `CONTRIBUTING.md` for the git branching strategy (`development` is the base branch; one
feature/fix branch per requirement, merged back once tested).
