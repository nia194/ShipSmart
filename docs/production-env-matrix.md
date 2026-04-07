# Production Environment Variable Matrix

## shipsmart-web (Static Site)

| Variable | Source | Required | Example |
|----------|--------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase dashboard > Settings > API | Yes | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard > Settings > API | Yes | `eyJ...` |
| `VITE_JAVA_API_BASE_URL` | Render service URL | Yes | `https://shipsmart-api-java.onrender.com` |
| `VITE_PYTHON_API_BASE_URL` | Render service URL | No* | `https://shipsmart-api-python.onrender.com` |
| `VITE_APP_ENV` | Fixed | Yes | `production` |
| `VITE_USE_JAVA_QUOTES` | Fixed | Yes | `true` |
| `VITE_USE_JAVA_SAVED_OPTIONS` | Fixed | Yes | `true` |
| `VITE_USE_JAVA_BOOKING_REDIRECT` | Fixed | Yes | `true` |

*Python API is skeleton only. Set the URL but no frontend code calls it yet.

## shipsmart-api-java (Web Service)

| Variable | Source | Required | Example |
|----------|--------|----------|---------|
| `SPRING_PROFILES_ACTIVE` | Fixed | Yes | `production` |
| `REQUIRE_JWT_SECRET` | Fixed | Yes | `true` |
| `DATABASE_URL` | Supabase > Settings > Database > Connection string | Yes | `jdbc:postgresql://...` |
| `DATABASE_USERNAME` | Supabase > Settings > Database | Yes | `postgres.xxx` |
| `DATABASE_PASSWORD` | Supabase > Settings > Database | Yes | (secret) |
| `SUPABASE_URL` | Supabase dashboard > Settings > API | Yes | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > Settings > API | Yes | `eyJ...` (secret) |
| `SUPABASE_JWT_SECRET` | Supabase dashboard > Settings > API > JWT Settings | Yes | (secret) |
| `CORS_ALLOWED_ORIGINS` | Render frontend URL | Yes | `https://shipsmart-web.onrender.com` |
| `INTERNAL_PYTHON_API_URL` | Render Python service URL | No* | `https://shipsmart-api-python.onrender.com` |

*Java→Python calls are not active yet.

**Note:** `PORT` is injected automatically by Render — do not set it manually.

### DATABASE_URL Format

Supabase provides a connection string like:
```
postgresql://postgres.xxx:password@host:5432/postgres
```

Spring Boot requires the `jdbc:` prefix:
```
jdbc:postgresql://host:5432/postgres?user=postgres.xxx&password=xxx&sslmode=require
```

Alternatively, use `DATABASE_URL` + `DATABASE_USERNAME` + `DATABASE_PASSWORD` separately.

## shipsmart-api-python (Web Service)

| Variable | Source | Required | Example |
|----------|--------|----------|---------|
| `APP_ENV` | Fixed | Yes | `production` |
| `SUPABASE_URL` | Supabase dashboard | Yes | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase dashboard | Yes | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard | Yes | `eyJ...` (secret) |
| `INTERNAL_JAVA_API_URL` | Render Java service URL | Yes | `https://shipsmart-api-java.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | Render frontend URL | Yes | `https://shipsmart-web.onrender.com` |

## Supabase (External)

Not deployed via Render. Managed via Supabase dashboard.

| Concern | Status |
|---------|--------|
| Database | Active — shared by both Supabase edge functions and Java backend |
| Auth | Active — Supabase Auth issues JWTs verified by Java backend |
| Edge Functions | Active as fallback — will be decommissioned after stable cutover |
| Storage | Not used |
| Realtime | Not used |
