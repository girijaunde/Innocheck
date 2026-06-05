# InnoCheck

AI-powered hackathon idea validation (semantic similarity, uniqueness, innovation gaps, literature-style output) plus a **prototype builder** with **Gemini**-generated code, **Sandpack** live preview for React/Vue, and **JWT authentication** with **per-user chat history** stored in **SQLite** or **PostgreSQL**.

## Backend layout

```
backend/
  app.py                 # FastAPI app, CORS, rate limiting
  core/config.py         # Env: DATABASE_URL, GEMINI_*, SECRET_KEY
  core/security.py       # JWT, bcrypt passwords
  api/deps.py            # DB session, auth dependencies
  rate_limit.py          # slowapi (per-IP or per-user when Bearer present)
  database/              # SQLAlchemy models + engine
  routers/               # auth, sessions, validate, prototype, analysis, feedback
  services/              # search, RAG, validation_service, prototype_generator
  utils/                 # llm (Gemini), embeddings, prompts
```

## Quick start

1. **Python 3.10+** recommended. Create a venv and install deps:

   ```bash
   python -m venv venv
   venv\Scripts\activate
   python -m pip install -r backend/requirements.txt
   ```

2. **Environment** — copy `backend/.env.example` to `backend/.env` (or `.env` in the project root). Set at least:

   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)
   - `SECRET_KEY` — long random string for JWT signing

3. **Run API** (from project root):

   ```bash
   uvicorn backend.app:app --reload --port 8000
   ```

4. **Frontend** — static ES modules + Sandpack require **HTTP** (not `file://`):

   ```bash
   cd frontend
   python -m http.server 8080
   ```

   Open `http://127.0.0.1:8080`.

## Features

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Chats**: `POST /api/sessions`, `GET /api/sessions`, `GET /api/sessions/{id}/messages`, `DELETE /api/sessions/{id}`
- **Analysis**: `POST /api/validate` with `mode`: `full` | `uniqueness` | `gaps` | `similar` | `suggestion` | `literature` (rate limited)
- **History**: `GET /api/history/me` (analyses), `GET /api/problem-results/{problem_id}`
- **Prototype**: `POST /api/prototype/generate`, `refine`, `explain`, `GET /api/prototype/history/me`, `GET /api/prototype/saved/{id}`

## Database

- Default: `sqlite:///./innocheck.db` (file created in the **current working directory** when you run uvicorn — usually project root).
- PostgreSQL: set `DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname`

If you change models, delete the old SQLite file or run migrations (Alembic not included in this scaffold).

## Notes

- **Rate limits** use `slowapi` (see decorators on routes). Authenticated requests are keyed by user id.
- Without `GEMINI_API_KEY`, analysis and prototype generation use **fallback** content where implemented.
- **Delete `innocheck.db`** if you hit schema errors after pulling updates (dev only).
