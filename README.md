ey-datafusion Monorepo

Structure:

- backend: FastAPI service (Python 3.11)
- frontend: React + Vite TypeScript UI

Quickstart (Backend):

1. Copy `.env.example` to `.env` and set values
2. Build and run: `docker compose up --build`
3. Local dev: `uvicorn app.main:app --reload` from `backend/`
4. Health check: `GET http://localhost:8000/healthz` → {"service":"ey-datafusion","version":"0.1.0"}

Environment variables:

- API_KEY, DB_DSN, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
- REGULATED_MODE=true|false (default true)
- DISABLE_OPENAPI=true|false (default false)
- ALLOWED_ORIGINS=*
- EMBEDDINGS_ENABLED=true|false
- MATCH_AUTO_THRESHOLD=0.70
- SAMPLE_N=2000

API base path is `/api/v1`. Health is also available at `/healthz`.

Development (Frontend):

- cd `frontend` → `npm install` → `npm run dev`
- Set `VITE_API_BASE` in `frontend/.env` if backend runs on a different host

Evidence Bundle:

- Build: `python backend/scripts/make_evidence.py <run_id> --out deliverables` → `deliverables/<run_id>.zip`

Endpoints:

- GET `/healthz`
- POST `/api/v1/profile`, `/api/v1/match`, `/api/v1/merge`, `/api/v1/validate`, `/api/v1/docs`
- POST `/api/v1/drift/check`, `/api/v1/templates/save`, `/api/v1/templates/apply`
- POST `/api/v1/runs/start`, `/api/v1/runs/complete` and GET `/api/v1/runs/{run_id}`
- POST `/api/v1/copilot/triage`, `/api/v1/copilot/fixit` (propose-only)

Commit policy:

- Conventional Commits; prefer small, single-file edits per commit.
- Examples: `feat(core): add JSON logging`, `chore(frontend): move file to monorepo`.


