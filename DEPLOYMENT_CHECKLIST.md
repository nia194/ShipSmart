# ShipSmart Render + Supabase Deployment Checklist

**Status:** Ready for Production Deployment ✅  
**Last Verified:** 2026-04-08  
**Deployment Platform:** Render Web Services + Static Site  
**Database:** Supabase PostgreSQL + pgvector

---

## PRE-DEPLOYMENT: 48 Hours Before

### Prerequisites & Credentials Collection

- [ ] **Supabase Project Created**
  - [ ] Project URL: `https://[PROJECT-REF].supabase.co`
  - [ ] Copy to notes

- [ ] **Supabase Database Credentials** (from Settings > Database)
  - [ ] Regular Connection String (for docs)
  - [ ] **Connection Pooler URL** (MUST use for Render)
    - [ ] Hostname: `[PROJECT-REF].pooler.supabase.com`
    - [ ] Port: `6543` (pgbouncer for async)
    - [ ] Copy to notes

- [ ] **Supabase API Keys** (Settings > API)
  - [ ] Project URL: `[PROJECT-REF].supabase.co` ← Note exact format
  - [ ] JWT Secret: `(copy exactly)` ← 256-char key, needed for Java API
  - [ ] Service Role Secret: `(copy exactly)` ← Needed for Java API
  - [ ] Anon Key (public): `(copy exactly)` ← Needed for frontend

- [ ] **GitHub Repository Connected to Render**
  - [ ] Render account created
  - [ ] GitHub repo authorized to Render
  - [ ] Can see repo in Render dashboard

### Database Preparation

- [ ] **Push Migrations to Supabase**
  ```bash
  supabase db push
  ```
  - [ ] All migrations applied successfully
  - [ ] No errors in migration output
  - [ ] Verify in Supabase dashboard:
    - [ ] `shipments` table exists
    - [ ] `quotes` table exists
    - [ ] `saved_options` table exists
    - [ ] `bookings` table exists
    - [ ] `rag_chunks` table exists (with pgvector extension)

- [ ] **Verify pgvector Setup**
  ```sql
  -- Run in Supabase SQL Editor
  SELECT * FROM information_schema.tables WHERE table_name='rag_chunks';
  SELECT extension_version('vector');
  ```
  - [ ] Both queries return results (no errors)

---

## DEPLOYMENT DAY: Morning (Order: Java → Python → Web)

### Phase 1: Create Render Services

- [ ] **Go to https://dashboard.render.com/**

- [ ] **Option A: Deploy from Blueprint** (RECOMMENDED)
  - [ ] Click "New" → "Blueprint"
  - [ ] Paste GitHub URL
  - [ ] Authorize GitHub
  - [ ] Select `render.yaml`
  - [ ] Review 3 services (web, api-java, api-python)
  - [ ] Proceed to environment variables

- [ ] **Option B: Create Services Manually**
  - [ ] **Service 1: api-java**
    - [ ] Type: Web Service
    - [ ] Root Dir: `apps/api-java`
    - [ ] Build: `./gradlew build -x test`
    - [ ] Start: `java -jar build/libs/shipsmart-api-java-0.1.0-SNAPSHOT.jar`
    - [ ] Health Check: `/api/v1/health`
  - [ ] **Service 2: api-python**
    - [ ] Type: Web Service
    - [ ] Root Dir: `apps/api-python`
    - [ ] Build: `pip install uv && uv sync`
    - [ ] Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
    - [ ] Health Check: `/health`
  - [ ] **Service 3: web**
    - [ ] Type: Static Site
    - [ ] Root Dir: `apps/web`
    - [ ] Build: `cd ../.. && pnpm install --frozen-lockfile && cd apps/web && pnpm build`
    - [ ] Publish Dir: `dist`

### Phase 2: Set Environment Variables (Java API)

**In Render Dashboard, select `shipsmart-api-java` service → Environment**

- [ ] **Database Configuration**
  - [ ] `DATABASE_URL` = `jdbc:postgresql://[PROJECT-REF].pooler.supabase.com:5432/postgres?sslmode=require`
    - [ ] Replace `[PROJECT-REF]` with actual project reference
  - [ ] `DATABASE_USERNAME` = Supabase database user (default: `postgres`)
  - [ ] `DATABASE_PASSWORD` = Supabase database password (from Settings > Database)

- [ ] **Supabase Integration**
  - [ ] `SUPABASE_URL` = `https://[PROJECT-REF].supabase.co` (exact format with `.co`)
  - [ ] `SUPABASE_JWT_SECRET` = (copy from Settings > API > JWT Secret, ~256 chars)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` = (copy from Settings > API > Service Role Secret)

**Verify all 3 database vars + 3 Supabase vars are set before proceeding**

### Phase 3: Set Environment Variables (Python API)

**In Render Dashboard, select `shipsmart-api-python` service → Environment**

- [ ] **Database (Optional, only if using pgvector RAG)**
  - [ ] `DATABASE_URL` = `postgresql://[USER]:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres?sslmode=require`
    - [ ] Replace `[USER]`, `[PASSWORD]`, `[PROJECT-REF]`
    - [ ] Note: Port is `6543` (pgbouncer) for Python async
  - [ ] ONLY set if deploying with `VECTOR_STORE_TYPE=pgvector`

- [ ] **LLM (Optional, leave empty for now)**
  - [ ] `OPENAI_API_KEY` = (leave empty, or set if you have OpenAI key)

**All other vars already set in render.yaml**

### Phase 4: Set Environment Variables (Frontend)

**In Render Dashboard, select `shipsmart-web` service → Environment**

- [ ] `VITE_SUPABASE_URL` = `https://[PROJECT-REF].supabase.co` (exact match)
  - [ ] Copy from Supabase Settings > API > Project URL
  - [ ] Must include `.co` at end

- [ ] `VITE_SUPABASE_ANON_KEY` = (copy from Settings > API > Anon Key, ~130 chars)
  - [ ] Must be the public anon key, not the service role key

**Verify both are set before deploying**

---

## DEPLOYMENT: Trigger Builds

### Service 1: Java API

- [ ] Click service name `shipsmart-api-java`
- [ ] Click "Deploy" (or click on branch to deploy specific commit)
- [ ] **Monitor logs** (should take ~2-3 minutes)
  - [ ] Watch for "BUILD SUCCESSFUL" message
  - [ ] Watch for Spring Boot startup messages
  - [ ] Look for any "ERROR" messages

- [ ] **Health Check** (once "Live" status shows)
  ```bash
  curl https://shipsmart-api-java.onrender.com/api/v1/health
  ```
  - [ ] Expected response: `{"status":"UP"}`
  - [ ] If error, check logs for database connection issues

### Service 2: Python API

- [ ] Click service name `shipsmart-api-python`
- [ ] Click "Deploy"
- [ ] **Monitor logs** (should take ~2-3 minutes)
  - [ ] Watch for "Uvicorn running on"
  - [ ] Watch for "LLM router initialized"
  - [ ] Watch for "RAG pipeline initialized"
  - [ ] Check for any "ERROR" messages (especially pgvector connection)

- [ ] **Health Check** (once "Live" status shows)
  ```bash
  curl https://shipsmart-api-python.onrender.com/health
  ```
  - [ ] Expected response: `{"status":"healthy"}`
  - [ ] If pgvector not connecting, check DATABASE_URL format

### Service 3: Web (Frontend)

- [ ] Click service name `shipsmart-web`
- [ ] Click "Deploy"
- [ ] **Monitor logs** (should take ~1 minute)
  - [ ] Look for build success message
  - [ ] No errors in build output

- [ ] **Verify** (once "Live" status shows)
  - [ ] Visit `https://shipsmart-web.onrender.com`
  - [ ] Page should load
  - [ ] No CORS errors in browser console
  - [ ] Can see Supabase Auth login form

---

## POST-DEPLOYMENT: Smoke Tests (All 3 Services Running)

### Frontend Tests

- [ ] **Page Load**
  - [ ] Visit `https://shipsmart-web.onrender.com`
  - [ ] Page loads without errors
  - [ ] Can see shipping quote form

- [ ] **Authentication**
  - [ ] Click "Sign In"
  - [ ] Try email/password login
  - [ ] Verify Supabase auth works
  - [ ] Can see authenticated user menu

- [ ] **API Connectivity Check (Browser Console)**
  - [ ] Open DevTools (F12)
  - [ ] Go to Network tab
  - [ ] Try creating a quote
  - [ ] Check that requests go to `shipsmart-api-java.onrender.com` (not localhost)
  - [ ] Verify responses are successful (200/201 status)

### Java API Tests

- [ ] **Health Endpoint**
  ```bash
  curl https://shipsmart-api-java.onrender.com/api/v1/health
  ```
  - [ ] Returns `{"status":"UP"}`

- [ ] **Get Shipments**
  ```bash
  curl -H "Authorization: Bearer [JWT_TOKEN]" \
    https://shipsmart-api-java.onrender.com/api/v1/shipments
  ```
  - [ ] Returns shipment list (may be empty)
  - [ ] No 401 Unauthorized (if you have JWT token)

- [ ] **CORS Check** (from frontend domain)
  ```javascript
  // Run in browser console on shipsmart-web.onrender.com
  fetch('https://shipsmart-api-java.onrender.com/api/v1/health').then(r => r.json()).then(console.log)
  ```
  - [ ] Should not get CORS error
  - [ ] Should get `{"status":"UP"}`

### Python API Tests

- [ ] **Health Endpoint**
  ```bash
  curl https://shipsmart-api-python.onrender.com/health
  ```
  - [ ] Returns JSON with healthy status

- [ ] **Advisor Endpoint**
  ```bash
  curl "https://shipsmart-api-python.onrender.com/api/v1/advisor/shipping?origin=New%20York&destination=Los%20Angeles"
  ```
  - [ ] Returns advisor recommendation (may use mock data)
  - [ ] No error messages

- [ ] **RAG Query**
  ```bash
  curl "https://shipsmart-api-python.onrender.com/api/v1/rag/query?q=shipping"
  ```
  - [ ] Returns results (may be empty or from mock documents)
  - [ ] No database connection errors

- [ ] **Vector Store Check** (check startup logs)
  - [ ] If using pgvector:
    - [ ] Log should show "Vector store backend: pgvector"
    - [ ] Should connect successfully without "CONNECTION REFUSED" errors
  - [ ] If using memory (default):
    - [ ] Log should show "Vector store backend: memory"

### Integration Tests

- [ ] **Frontend → Java**
  - [ ] Use app to create a quote
  - [ ] Verify data appears in Java API responses

- [ ] **Frontend → Python**
  - [ ] Go to Advisor page
  - [ ] Verify shipping advisor returns advice
  - [ ] Check Network tab — should see calls to Python API

- [ ] **Java → Database**
  - [ ] Create a shipment via Java API
  - [ ] Verify it persists (query again, should still exist)

- [ ] **Python → Database** (if pgvector enabled)
  - [ ] Check Python logs for "vector store already has X chunks"
  - [ ] Query RAG endpoint — should return results

---

## TROUBLESHOOTING

### If Java API won't start

**Symptom:** Deployment fails or service crashes  
**Logs to check:** "DATABASE_URL", "connection refused", "authentication failed"

```
1. Verify DATABASE_URL format:
   - Should be: jdbc:postgresql://HOST:PORT/postgres?sslmode=require
   - NOT: postgresql://... (that's for Python)
   
2. Verify credentials:
   - DATABASE_USERNAME: typically "postgres"
   - DATABASE_PASSWORD: from Supabase (Settings > Database)
   
3. Verify Supabase:
   - Can you connect locally with these credentials?
   - Is pgbouncer enabled? (should be for Render)
   
4. Check logs in Render dashboard:
   - Look for "connection refused" → wrong host/port
   - Look for "authentication failed" → wrong password
   - Look for "SSL error" → try adding ?sslmode=require
```

### If Python API crashes on startup

**Symptom:** Service starts, then crashes  
**Logs to check:** "vector store", "asyncpg", "connection"

```
1. If DATABASE_URL error (pgvector):
   - Format should be: postgresql://USER:PASS@HOST:6543/postgres?sslmode=require
   - Port: 6543 (NOT 5432) for pooler
   - Only set if VECTOR_STORE_TYPE=pgvector
   
2. If pgvector table doesn't exist:
   - Run: supabase db push (to apply migrations)
   - Verify rag_chunks table exists
   
3. If RAG auto-ingest fails:
   - Check logs for "auto-ingesting documents"
   - Verify `data/documents/` directory exists with files
   - If not found, that's OK — RAG will be empty until docs added
```

### If frontend can't reach APIs

**Symptom:** CORS errors in browser console, or "Cannot reach API"  
**Logs to check:** Browser Network tab, browser Console

```
1. Verify service URLs are correct:
   - Frontend should call: https://shipsmart-api-java.onrender.com
   - Frontend should call: https://shipsmart-api-python.onrender.com
   - NOT localhost:8080 or localhost:8000
   
2. Check CORS settings in APIs:
   - Both should have: CORS_ALLOWED_ORIGINS=https://shipsmart-web.onrender.com
   - Check render.yaml — these should already be set
   
3. If still getting CORS error:
   - Check render.yaml for typos in origins
   - Redeploy APIs after verifying env vars
   
4. If 404 errors:
   - Verify endpoints exist: /api/v1/health (Java), /health (Python)
   - Check health check paths in render.yaml
```

### If RAG/pgvector not working

**Symptom:** RAG queries return empty, or pgvector connection fails  
**Logs to check:** Python service logs, Supabase SQL editor

```
1. Verify pgvector extension exists:
   - In Supabase SQL Editor:
     SELECT extension_version('vector');
   - Should return a version, not error
   
2. Verify rag_chunks table exists:
   - In Supabase SQL Editor:
     SELECT COUNT(*) FROM rag_chunks;
   - Should return a number (0 if empty, OK for now)
   
3. Verify DATABASE_URL is set:
   - Check Python service environment vars
   - Must be set if VECTOR_STORE_TYPE=pgvector
   - Port: 6543, not 5432
   
4. Verify VECTOR_STORE_TYPE:
   - Check render.yaml — should be "pgvector" for production
   - Or set via environment override
   
5. Check logs for auto-ingest:
   - Should see "auto-ingesting documents" or "already has X chunks"
   - If seeing neither, check logs for errors
```

---

## POST-DEPLOYMENT: Next Steps (Optional Enhancements)

### Enable Real LLM (Recommended)

To upgrade from mock EchoClient to real AI:

1. **Get OpenAI API Key:**
   - Go to https://platform.openai.com/api/keys
   - Create new secret key
   - Copy key (starts with `sk-`)

2. **Update Python Service in Render:**
   - Select `shipsmart-api-python`
   - Environment tab
   - Set `LLM_PROVIDER` = `openai`
   - Set `OPENAI_API_KEY` = (paste your key)
   - Deploy

3. **Verify:**
   - Check logs for "LLM provider: openai"
   - Test advisor endpoints — should now return real responses
   - Monitor OpenAI costs (watch usage in API dashboard)

### Enable Real Embeddings (For Better RAG)

To improve RAG search with semantic embeddings:

1. **Set in Python Service:**
   - `EMBEDDING_PROVIDER` = `openai`
   - (requires same OPENAI_API_KEY as above)
   - Rebuild pgvector table if changing embedding dimensions

2. **Ingest More Documents:**
   - Add documents to `data/documents/`
   - Commit and push to GitHub
   - Redeploy Python service
   - Should auto-ingest on startup

---

## FINAL VERIFICATION CHECKLIST

- [ ] All 3 services show "Live" (green) in Render dashboard
- [ ] Java API health check returns UP
- [ ] Python API health check returns healthy
- [ ] Frontend loads and authenticates with Supabase
- [ ] No errors in browser console
- [ ] No errors in Render service logs (5 minutes after deploy)
- [ ] API calls from frontend have correct origin (not localhost)
- [ ] Database persists data (shipments/quotes survive restart)
- [ ] Render project linked to GitHub (for auto-deploy on push)

---

## 🎉 Deployment Complete!

Your ShipSmart application is now live on Render + Supabase.

- **Frontend:** https://shipsmart-web.onrender.com
- **Java API:** https://shipsmart-api-java.onrender.com
- **Python API:** https://shipsmart-api-python.onrender.com

**Monitor these pages for ongoing health:**
- Render Dashboard: https://dashboard.render.com/
- Supabase Dashboard: https://app.supabase.com/

**Next iteration roadmap:**
- Enable real OpenAI for advisors + RAG
- Add rate limiting + auth to Python API
- Integrate real shipping carriers (UPS, FedEx, etc.)
- Set up CI/CD for auto-deploy on GitHub push

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-08  
**Status:** Production Ready ✅
