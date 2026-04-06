# ShipSmart — Render Deployment Guide

## Service Architecture on Render

| Service        | Render Type   | Plan    | Health Check         | Status    |
|----------------|---------------|---------|----------------------|-----------|
| `web` (React)  | Static Site   | Free    | (automatic)          | Active    |
| `api-java`     | Web Service   | Starter | `/api/v1/health`     | Active    |
| `api-python`   | Web Service   | Starter | `/health`            | Skeleton  |

## Initial Deployment Steps

### Step 1: Prepare the repo

1. Ensure `gradle-wrapper.jar` is committed:
   ```bash
   cd apps/api-java
   gradle wrapper --gradle-version 8.12
   git add gradle/wrapper/gradle-wrapper.jar
   ```

2. Replace placeholder service names in `render.yaml` if you use different names
   than `shipsmart-web`, `shipsmart-api-java`, `shipsmart-api-python`.

3. Push to GitHub.

### Step 2: Create Blueprint on Render

1. Go to [render.com](https://render.com) → New → Blueprint
2. Connect your GitHub repo and select `render.yaml`
3. Render will detect all three services

### Step 3: Set environment variables

Set secrets in the Render dashboard for each service.
See `docs/production-env-matrix.md` for the complete list.

**Critical secrets (not in render.yaml):**
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for web
- `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` for api-java
- `SUPABASE_JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` for api-java

### Step 4: Deploy and verify

Follow the deployment order in `docs/deployment-cutover-plan.md`:
1. api-java first → verify health check
2. web second → verify with feature flags
3. api-python optional

Run the smoke tests in `docs/post-deploy-smoke-test.md`.

## Build Commands

| Service | Build | Start |
|---------|-------|-------|
| web | `cd ../.. && pnpm install --frozen-lockfile && cd apps/web && pnpm build` | (static) |
| api-java | `./gradlew build -x test` | `java -jar build/libs/shipsmart-api-java-0.1.0-SNAPSHOT.jar` |
| api-python | `pip install uv && uv sync` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

## Service Communication

```
Frontend  → VITE_JAVA_API_BASE_URL   → api-java (public URL)
Frontend  → VITE_PYTHON_API_BASE_URL → api-python (public URL)
api-java  → INTERNAL_PYTHON_API_URL  → api-python
api-python → INTERNAL_JAVA_API_URL   → api-java
```

## Cold Starts

Render Starter plan services sleep after 15 minutes of inactivity.
First request after sleep takes ~30s. Options:
- Upgrade to paid plan
- Add an uptime monitor (e.g., Better Uptime, UptimeRobot) pinging `/api/v1/health`

## Custom Domains

When adding custom domains:
1. Configure in Render dashboard → Settings → Custom Domain
2. Update `CORS_ALLOWED_ORIGINS` on both api-java and api-python to include the custom domain
3. Update `VITE_JAVA_API_BASE_URL` if the Java API gets a custom domain
