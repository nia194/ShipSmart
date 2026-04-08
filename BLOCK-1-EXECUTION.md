# BLOCK 1: GitHub Push + Supabase Database Setup

## Overview
Before Render deployment, we need:
1. ✅ Code pushed to GitHub (develop branch)
2. ✅ Supabase project linked locally
3. ✅ Migrations applied (vector extension + rag_chunks table)
4. ✅ Database connectivity verified
5. ✅ All app tables confirmed to exist

**Project ID:** `fihrsfvohaxhmqrcisyl`
**Migrations ready:** Yes (20260408034204_create_rag_chunks.sql exists)

---

## STEP 1: Verify & Push to GitHub

### Status Check
```bash
cd "C:/Users/ashis/OneDrive/Documents/ShipSmart"
git status  # Should show "nothing to commit, working tree clean"
git log --oneline -5  # Verify you're at the right commit
```

### Current Branch Status
- Local branch: `feature/v2.0` (matches develop)
- Remote HEAD: `origin/main`
- Default branch to push: `develop`

### Push Command
```bash
git push origin develop
```

Expected output:
```
branch 'develop' set up to track 'origin/develop'
```

### Validation
```bash
git log origin/develop --oneline -1
# Should match your local: 896a456 (or later)
```

---

## STEP 2: Supabase Prerequisite Check

### Prerequisites
Before running migrations you MUST have:
1. ✅ Supabase account (https://supabase.com)
2. ✅ Project created (named "ShipSmart" or similar)
3. ✅ Project reference: `fihrsfvohaxhmqrcisyl` (in config.toml)

### Find Your Access Token
```bash
# Go to: https://supabase.com/dashboard/account/tokens
# Click "Create new token"
# Name: "ShipSmart Deploy"
# Expiry: 30+ days
# Copy the token (keep it secret)
```

### Link Supabase Project Locally
```bash
# Install Supabase CLI if not present
npm install -g @supabase/cli

# Link your project
supabase link --project-ref fihrsfvohaxhmqrcisyl --password <your-postgres-password>

# When prompted for an access token, paste the token from step above
```

**Output should show:**
```
✔ Successfully linked to project: fihrsfvohaxhmqrcisyl
✔ Connected to Postgres database
```

### Validation
```bash
supabase status
# Should show: 
# - Postgres: 15
# - S3: OK
# - Realtime: OK
```

---

## STEP 3: Apply Migrations

### Push Migrations to Supabase
```bash
supabase db push
```

This will:
1. Read migrations from `supabase/migrations/`
2. Apply them to the remote Supabase database
3. Create `rag_chunks` table with vector extension

**Expected output:**
```
✔ Migrations applied successfully
✔ Vector extension enabled
✔ Table rag_chunks created
```

### Manual Validation (in Supabase Dashboard)
```sql
-- Go to: https://supabase.com/dashboard/project/fihrsfvohaxhmqrcisyl/sql
-- Run these queries:

-- 1. Confirm vector extension
SELECT extname FROM pg_extension WHERE extname='vector';
-- Expected: Returns "vector"

-- 2. Confirm rag_chunks table
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_name='rag_chunks';
-- Expected: Returns "rag_chunks"

-- 3. Confirm columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name='rag_chunks' ORDER BY ordinal_position;
-- Expected columns:
-- - id (bigint)
-- - source (text)
-- - chunk_index (integer)
-- - text (text)
-- - embedding (USER-DEFINED / vector)
-- - metadata (jsonb)
-- - created_at (timestamp with time zone)

-- 4. Confirm indexes
SELECT indexname FROM pg_indexes WHERE tablename='rag_chunks';
-- Expected:
-- - rag_chunks_pkey
-- - rag_chunks_embedding_idx (ivfflat)
-- - rag_chunks_source_idx
```

---

## STEP 4: Get Database Connection String

### From Supabase Dashboard
```
Go to: https://supabase.com/dashboard/project/fihrsfvohaxhmqrcisyl/settings/database
Copy: Connection string (Postgres URI)
```

Format should be:
```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
```

### Test Connection Locally
```bash
# Install psql if needed, then:
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Once connected, run:
SELECT COUNT(*) FROM rag_chunks;
-- Expected: 0 (empty, ready for ingestion)

\q  # Quit
```

---

## STEP 5: Update Python .env with Database URL

### File: `apps/api-python/.env`
```bash
# Add these lines (use the connection string from Step 4):
VECTOR_STORE_TYPE=pgvector
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
PGVECTOR_TABLE=rag_chunks
RAG_AUTO_INGEST=true

# Keep existing LLM config:
OPENAI_API_KEY=<your key>
LLM_PROVIDER_REASONING=openai
LLM_PROVIDER_SYNTHESIS=openai
EMBEDDING_PROVIDER=openai
```

### File: `supabase/.env.local` (for local Supabase development)
```bash
POSTGRES_PASSWORD=<local postgres password>
```

---

## STEP 6: Verify Python API Can Connect to Database

### Boot Python API
```bash
cd apps/api-python
uv run uvicorn app.main:app --reload
```

### Expected Startup Logs
```
Starting shipsmart-api-python v0.1.0 in 'development' mode
Vector store backend: pgvector (PGVectorStore)
Persistent vector store empty — auto-ingesting documents
Loaded 14 documents from data/documents
Embedding 67 chunks...
Ingested 67 chunks into pgvector
LLM router initialized: {'reasoning': 'openai', 'synthesis': 'openai', 'fallback': 'echo'}
RAG pipeline initialized (embedding=OpenAIEmbedding)
Tool registry initialized: 2 tools, provider=mock
```

### Validation Query
```sql
-- In Supabase dashboard:
SELECT COUNT(*), COUNT(DISTINCT source) FROM rag_chunks;
-- Expected: 67 chunks, ~14 sources
```

---

## STEP 7: Final Checklist

- [ ] Code pushed to GitHub (`git push origin develop`)
- [ ] Supabase project linked locally (`supabase link`)
- [ ] Migrations applied (`supabase db push`)
- [ ] Vector extension enabled (query returns `vector`)
- [ ] `rag_chunks` table exists with all columns
- [ ] Indexes created (embedding_idx, source_idx)
- [ ] Database connection string obtained
- [ ] Python `.env` updated with `DATABASE_URL` and `VECTOR_STORE_TYPE=pgvector`
- [ ] Python API boots without errors
- [ ] Auto-ingestion succeeds (67 chunks in database)
- [ ] `SELECT COUNT(*) FROM rag_chunks` returns 67

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `supabase link` fails — "Cannot reach project" | Check project ID in `supabase/config.toml`; verify access token is valid |
| Migrations don't apply | Run `supabase db push --force-reset` (WARNING: deletes local data) |
| `rag_chunks` table not found after push | Check migrations folder; confirm push completed successfully |
| Python API says "Vector store type is memory" | Check `VECTOR_STORE_TYPE=pgvector` in `.env`; must be set before boot |
| Auto-ingest runs but 0 chunks stored | Check `DATABASE_URL` is correct; verify `openai` embedding provider is set |
| psql connection fails | Verify password, host, and port; ensure `sslmode=require` is in connection string |

---

## Next Steps (After Block 1 Passes)

Once all validations pass:
- Block 2: Boot Java API + test auth
- Block 3: Boot Python API + RAG validation
- Block 4: Test all advisor flows
- Block 5: Deploy to Render

