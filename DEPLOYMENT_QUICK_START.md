# ShipSmart Deployment — Quick Start Guide

**TL;DR:** Your app is ready. Push migrations, set 8 secrets in Render, deploy. Done.

---

## 🚀 Deploy in 5 Steps

### Step 1: Push Database Migrations (Supabase)
```bash
supabase db push
```
This creates tables + pgvector RAG schema. Wait for success.

**What it does:**
- Creates: shipments, quotes, saved_options, bookings tables
- Creates: `rag_chunks` table with pgvector(1536) for AI
- Enables pgvector extension

---

### Step 2: Get Supabase Credentials

From Supabase dashboard (Settings > API):
```
Project URL          → VITE_SUPABASE_URL (frontend)
Anon Key            → VITE_SUPABASE_ANON_KEY (frontend)
JWT Secret          → SUPABASE_JWT_SECRET (Java API)
Service Role Key    → SUPABASE_SERVICE_ROLE_KEY (Java API)
```

From Database settings:
```
Connection Pooler URL  → For Java: jdbc:postgresql://[host]:5432/postgres?sslmode=require
                       → For Python: postgresql://user:pass@[host]:6543/postgres?sslmode=require
DB Username            → DATABASE_USERNAME (Java API)
DB Password            → DATABASE_PASSWORD (Java API)
```

---

### Step 3: Create/Update Render Services

**Option A (Recommended): Use Blueprint**
```
1. Go to https://dashboard.render.com/
2. New > Blueprint
3. Paste GitHub repo URL + connect
4. Use render.yaml automatically
```

**Option B: Manual**
- Create 3 Web Services (api-java, api-python) + 1 Static Site (web)
- Point each to correct directory (rootDir in render.yaml)
- Use commands from render.yaml

---

### Step 4: Set Secrets in Render Dashboard

**For `shipsmart-api-java` service:**
| Variable | Value |
|----------|-------|
| DATABASE_URL | jdbc:postgresql://[host]:5432/postgres?sslmode=require |
| DATABASE_USERNAME | [postgres user] |
| DATABASE_PASSWORD | [postgres password] |
| SUPABASE_URL | https://[project-ref].supabase.co |
| SUPABASE_JWT_SECRET | [JWT secret] |
| SUPABASE_SERVICE_ROLE_KEY | [service role key] |

**For `shipsmart-api-python` service:**
| Variable | Value | Optional? |
|----------|-------|-----------|
| DATABASE_URL | postgresql://user:pass@[host]:6543/postgres?sslmode=require | Yes (only if using pgvector) |
| OPENAI_API_KEY | [your key] | Yes (only for real AI) |

**For `shipsmart-web` service:**
| Variable | Value |
|----------|-------|
| VITE_SUPABASE_URL | https://[project-ref].supabase.co |
| VITE_SUPABASE_ANON_KEY | [anon key] |

---

### Step 5: Deploy!

Deploy in this order:
1. **api-java** — Click "Deploy" → Wait ~3 min
2. **api-python** — Click "Deploy" → Wait ~3 min  
3. **web** — Click "Deploy" → Wait ~1 min

---

## ✅ Verify It Works

### After Java Deploys
```bash
curl https://shipsmart-api-java.onrender.com/api/v1/health
# Should respond: {"status":"UP"}
```

### After Python Deploys
```bash
curl https://shipsmart-api-python.onrender.com/health
# Should respond: {"status":"healthy"}
```

### After Web Deploys
```
Visit: https://shipsmart-web.onrender.com
• Sign in with Supabase
• Try a quote search
• Check shipping advisor page
```

---

## 🎯 What You Get

✅ **Frontend:** React SPA, hosted globally on Render CDN  
✅ **Java API:** Spring Boot, transactional logic (quotes, shipments, etc.)  
✅ **Python API:** FastAPI, AI advisors + RAG knowledge base  
✅ **Database:** Supabase PostgreSQL + pgvector for AI  
✅ **Auth:** Supabase Auth (JWT)  
✅ **RAG:** Auto-ingests docs on startup  
✅ **Mock Defaults:** Safe to deploy, works without external APIs  

---

## 🎨 Enable Real AI (Optional, Do Later)

Once deployed, upgrade to real AI in Render dashboard:

### Option 1: Use OpenAI
```
Set in shipsmart-api-python:
  LLM_PROVIDER = openai
  OPENAI_API_KEY = sk-... (from https://platform.openai.com/api/keys)
  EMBEDDING_PROVIDER = openai (for semantic search in RAG)

Cost: ~$0.02 per 1M tokens
```

### Option 2: Use Anthropic / Claude
```
Set in shipsmart-api-python:
  LLM_PROVIDER = anthropic
  ANTHROPIC_API_KEY = sk-ant-... (from https://console.anthropic.com/)
  LLM_PROVIDER_REASONING = anthropic (optional: for advisors)

Cost: Depends on model
```

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Database connection refused" | Check DATABASE_URL format + verify pooler URL is correct |
| "JWT verification failed" | Ensure SUPABASE_JWT_SECRET matches exactly |
| "CORS error from frontend" | Check CORS_ALLOWED_ORIGINS in both APIs |
| "Python API won't start" | Check logs for missing OPENAI_API_KEY (if LLM_PROVIDER=openai) |
| "RAG returns empty results" | Check if docs in `data/documents/` were auto-ingested (check logs) |

---

## 📚 Full Docs

For deeper info, see:
- `DEPLOYMENT_AUDIT.md` — Complete audit with all env vars + configs
- `render.yaml` — Service definitions
- `.env.example` files — All available config options
- READMEs in each service folder

---

## 🎉 Done!

Your ShipSmart deployment is live. Congrats! 🚀

**Next steps (optional):**
- Enable real LLM + embeddings
- Set up monitoring / alerting
- Configure CI/CD for auto-deploy
- Scale Python API if needed (higher plan)
