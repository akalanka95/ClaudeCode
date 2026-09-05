# Deployment guide

This covers two things: running the full stack locally with one command, and putting it live on
free-tier hosting for a demo link.

The `sync-agent` sidecar (Claude Agent SDK-powered subtopic Sync) is **not** part of either path
below — it authenticates with a personal Claude Code OAuth token and spawns a local `claude` CLI
process, which isn't something to expose publicly. The Docker/deploy builds set
`VITE_ENABLE_SYNC=false`, which hides the Sync button entirely; everything else (topics,
subtopics, edges, note blocks, details, references) works normally.

Semantic search is different: it uses standard metered API keys (`ANTHROPIC_API_KEY`,
`VOYAGE_API_KEY`), so — unlike Sync — it *can* be exposed publicly. But "can" isn't "should
by default": every search request costs real money on a link anyone can hit with no login. The
local Docker build below leaves it on (nothing to spend against unless you supply keys); the
public deploy steps set `VITE_ENABLE_SEARCH=false` and leave it opt-in — flip it on only after
setting a spend limit for those keys in the Anthropic/Voyage consoles.

## Run the full stack locally with Docker

```
docker compose up --build
```

Starts Postgres, Qdrant, the backend (`http://localhost:8080/api/v1`), and the frontend
(`http://localhost:5173`) together. No manual Maven/npm steps needed. Stop with `Ctrl+C`, or
`docker compose down` (add `-v` to also drop the Postgres/Qdrant volumes). Semantic search works
if `ANTHROPIC_API_KEY`/`VOYAGE_API_KEY` are set in your shell before running the command (see
`docker-compose.yml`); otherwise it stays inert and everything else works normally.

## Deploy a live demo

### 1. Backend + Postgres (Render, free tier)

1. Push this repo to GitHub if it isn't already.
2. In Render: **New > PostgreSQL** — create a free instance, note the internal connection details
   (host, database, username, password).
3. **New > Web Service** — point it at this repo, root directory `backend`, and let Render detect
   `backend/Dockerfile` (or set the runtime to Docker explicitly).
4. Set environment variables on the web service:
   - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://<render-db-host>:5432/<db-name>`
   - `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` = from step 2
   - `APP_CORS_ALLOWED_ORIGIN` = the frontend URL from step 5 below (you can come back and set
     this once you have it)
   - `APP_JWT_SECRET` = a long random string (e.g. `openssl rand -base64 48`)
   - `APP_OAUTH_FRONTEND_REDIRECT_BASE_URL` = the frontend URL from step 5 below — this is where
     the browser lands (with its token) after a Google login completes
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` = from a Google Cloud Console OAuth client
     (type "Web application") with authorized redirect URI
     `https://<your-backend>.onrender.com/login/oauth2/code/google`. The `admin`/`skill_loop`
     login works even if these are left unset — only Google sign-in needs them.
   - Render injects `PORT` automatically; `application.yml` already reads it.
   - Leave `ANTHROPIC_API_KEY`/`VOYAGE_API_KEY`/`APP_QDRANT_HOST` unset unless you're turning on
     semantic search publicly (see the caveat above) — the backend boots fine without them, that
     feature just stays inert. If you do turn it on, you'll also need a reachable Qdrant instance
     (e.g. Qdrant Cloud's free tier — set `APP_QDRANT_HOST`, `APP_QDRANT_USE_TLS=true`, and
     `APP_QDRANT_API_KEY` to match).
5. Deploy, then confirm `https://<your-backend>.onrender.com/api/v1/boards/root` returns JSON.

Railway works the same way (Dockerfile-based service + managed Postgres + the same env vars) if
you prefer it.

### 2. Frontend (Vercel, or Render static site)

1. New project pointed at this repo, root directory `frontend`.
2. Build command `npm run build`, output directory `dist`.
3. Environment variables:
   - `VITE_API_BASE_URL` = `https://<your-backend>.onrender.com/api/v1`
   - `VITE_ENABLE_SYNC` = `false`
   - `VITE_ENABLE_SEARCH` = `false` (flip to `true` only once the backend's search keys are set
     *and* you've set a spend limit for them — see the caveat above)
4. Deploy, then go back to the backend's `APP_CORS_ALLOWED_ORIGIN` and set it to this frontend's
   URL (e.g. `https://your-app.vercel.app`), redeploying the backend so CORS allows it.

### 3. Seed demo data

Once both are live and reachable:

```
API_BASE=https://<your-backend>.onrender.com/api/v1 node scripts/seed-mock-data.mjs
```

It talks to the real REST API, so it works against a deployed backend exactly like a local one.

### Caveats

- Free-tier services on Render/Railway spin down when idle — the first request after a while can
  take 20-30s to wake back up. Fine for a CV demo link, just don't be surprised by it live.
- Update `APP_CORS_ALLOWED_ORIGIN` any time the frontend's deployed URL changes, or API requests
  will fail with CORS errors in the browser console.
- Same for `APP_OAUTH_FRONTEND_REDIRECT_BASE_URL` and the Google OAuth client's authorized
  redirect URI (`https://<backend>/login/oauth2/code/google`) — both are tied to the backend's
  own URL, not the frontend's, so they only need updating if the *backend's* deployed URL
  changes.
