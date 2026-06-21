# re-dact

> A small document/image/video redaction service with a Next.js frontend and Flask backend.

## Repository structure

- `backend/` — Flask API, redaction services, Dockerfile, Python dependencies.
- `frontend/` — Next.js (TypeScript + Tailwind) UI and client code.

## Prerequisites

- Node.js 18+ and npm or pnpm for the frontend
- Python 3.9+ and pip for the backend (Docker recommended for a reproducible environment)
- Docker (optional, for containerizing the backend)

## Backend — local setup

1. Create and activate a virtual environment (Windows):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Linux / macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```
pip install -r backend/requirements.txt
```

3. Run the Flask API (development):

```
python backend/app.py
```

The backend runs on port `5000` by default. Change `PORT` or set an `.env` file if needed.

## Backend — Docker

Build and run the image from the repository root:

```bash
docker build -t re-dact-backend ./backend
docker run -p 5000:5000 re-dact-backend
```

## Frontend — local setup

1. Install dependencies and run the dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Open the app at `http://localhost:3000` (Next.js default). The production `start` script runs on port `3003` by default (`npm start`).

3. If the frontend needs to talk to the backend, point requests to `http://localhost:5000` (or adjust `NEXT_PUBLIC_API_BASE` in a `.env.local` file if you add that variable).


Place the file inside the `frontend/src` (or another folder included by `tsconfig.json`).

## Useful commands

- Start backend (dev): `python backend/app.py`
- Build backend image: `docker build -t re-dact-backend ./backend`
- Start frontend (dev): `cd frontend && npm run dev`
- Build frontend for production: `cd frontend && npm run build && npm start`
