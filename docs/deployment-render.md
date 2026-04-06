# ShipSmart — Render Deployment Guide

## Service Architecture on Render

| Service        | Render Type   | Plan    | Health Check         |
|----------------|---------------|---------|----------------------|
| `web` (React)  | Static Site   | Free    | (automatic)          |
| `api-java`     | Web Service   | Starter | `/api/v1/health`     |
| `api-python`   | Web Service   | Starter | `/health`            |

## Why React as a Static Site (not Web Service)?

The React app is a Vite-bundled SPA with no server-side rendering.
A Static Site on Render:
- Is free
- Serves from a CDN (faster globally)
- Has no cold starts
- Supports SPA routing via the `/*` rewrite rule in `render.yaml`

**Switch to a Web Service only if you need SSR, server-side auth cookies, or dynamic headers.**

## Initial Deployment Steps

### Step 1: Connect the monorepo to Render

1. Push the ShipSmart monorepo to GitHub.
2. Go to [render.com](https://render.com) → New → Blueprint.
3. Connect your GitHub repo and select `render.yaml` as the blueprint.
4. Render will detect all three services.

### Step 2: Fill in environment variables

Before services can start, set these in the Render dashboard for each service:

**For `web` (Static Site):**
- `VITE_SUPABASE_URL` — from Supabase dashboard
- `VITE_SUPABASE_ANON_KEY` — from Supabase dashboard

**For `api-java` (Web Service):**
- `DATABASE_URL` — Supabase Postgres connection string (with pooler)
- `DATABASE_USERNAME` — Supabase DB username
- `DATABASE_PASSWORD` — Supabase DB password
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

**For `api-python` (Web Service):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

### Step 3: Replace placeholder service names

In `render.yaml`, replace all placeholder values:
- `[RENDER_SERVICE_NAME_WEB]` → e.g., `shipsmart-web`
- `[RENDER_SERVICE_NAME_JAVA]` → e.g., `shipsmart-api-java`
- `[RENDER_SERVICE_NAME_PYTHON]` → e.g., `shipsmart-api-python`

### Step 4: Initialize Gradle wrapper (for Java)

Before pushing, run inside `apps/api-java/`:
```bash
gradle wrapper --gradle-version 9.4.1
```
This generates the `gradlew` binary and `gradle-wrapper.jar`.
Commit both to the repo — Render uses them for builds.

### Step 5: Verify build commands

Java: `./gradlew build -x test`
Python: `pip install uv && uv sync --frozen`
Web: `pnpm install && pnpm build`

## Environment Variable Cross-References

The services reference each other via env vars:
```
web         → VITE_JAVA_API_BASE_URL  = https://[api-java].onrender.com
web         → VITE_PYTHON_API_BASE_URL = https://[api-python].onrender.com
api-java    → PYTHON_API_BASE_URL     = https://[api-python].onrender.com
api-python  → JAVA_API_BASE_URL       = https://[api-java].onrender.com
```

These cross-references are already set in `render.yaml`. Update the placeholders.

## Monorepo-Aware Builds on Render

Render supports monorepos via `rootDir` in `render.yaml`.
Each service specifies its own `rootDir`:
- `apps/web` for the frontend
- `apps/api-java` for Spring Boot
- `apps/api-python` for FastAPI

Render will only rebuild a service when files in its `rootDir` change
(if using Render's auto-deploy with GitHub push).

## Cold Starts

Render Starter plan Web Services will sleep after inactivity and have cold starts (~30s).
Upgrade to a paid plan or add an uptime monitor (e.g., Better Uptime) to avoid this.

## Logs

Access logs per service in the Render dashboard under each service → Logs.

## Custom Domains

Set a custom domain per service in Render dashboard → Settings → Custom Domain.
Update CORS env vars in all services when custom domains are added.
