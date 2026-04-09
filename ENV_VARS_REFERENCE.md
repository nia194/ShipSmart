# Environment Variables Reference — All Services

Quick lookup table for all configuration variables across all services.

---

## React Frontend (`apps/web`)

| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `VITE_SUPABASE_URL` | Secret | ✅ Yes | Supabase API settings | — | Project URL, e.g., `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Secret | ✅ Yes | Supabase API settings | — | Public anon key for client-side auth |
| `VITE_JAVA_API_BASE_URL` | Config | No | render.yaml | `http://localhost:8080` | Backend Java API URL |
| `VITE_PYTHON_API_BASE_URL` | Config | No | render.yaml | `http://localhost:8000` | Backend Python API URL |
| `VITE_APP_ENV` | Config | No | render.yaml | `development` | Set to `production` to disable debug features |
| `VITE_USE_JAVA_QUOTES` | Flag | No | render.yaml | `false` | Use Java API instead of edge function |
| `VITE_USE_JAVA_SAVED_OPTIONS` | Flag | No | render.yaml | `false` | Use Java API instead of edge function |
| `VITE_USE_JAVA_BOOKING_REDIRECT` | Flag | No | render.yaml | `false` | Use Java API instead of edge function |

**File:** `apps/web/src/config/api.ts`

---

## Spring Boot Java API (`apps/api-java`)

### Database & Auth
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `DATABASE_URL` | Secret | ✅ Yes | Supabase | — | JDBC format: `jdbc:postgresql://host:5432/postgres?sslmode=require` |
| `DATABASE_USERNAME` | Secret | ✅ Yes | Supabase | — | PostgreSQL user from Supabase |
| `DATABASE_PASSWORD` | Secret | ✅ Yes | Supabase | — | PostgreSQL password from Supabase |
| `SUPABASE_URL` | Secret | ✅ Yes | Supabase | — | Project URL for client initialization |
| `SUPABASE_JWT_SECRET` | Secret | ✅ Yes | Supabase | — | JWT signing secret (Settings > API > JWT Secret) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | No | Supabase | — | Service role key for admin operations |

### Server Config
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `SPRING_PROFILES_ACTIVE` | Config | ✅ Yes | render.yaml | `local` | Must be `production` for prod |
| `REQUIRE_JWT_SECRET` | Config | ✅ Yes | render.yaml | `false` | Must be `true` for prod |
| `PORT` | Config | No | Render (auto) | `8080` | Automatically set by Render |
| `SERVER_PORT` | Config | No | .env | `8080` | Local dev fallback |

### Security & Network
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `CORS_ALLOWED_ORIGINS` | Config | No | render.yaml | `http://localhost:5173` | Frontend origin(s) for CORS |
| `INTERNAL_PYTHON_API_URL` | Config | No | render.yaml | `http://localhost:8000` | For Java → Python calls |

**Files:** 
- `src/main/resources/application.yml` (base)
- `src/main/resources/application-production.yml` (prod overrides)
- `src/main/resources/application-local.yml` (local overrides)

---

## FastAPI Python API (`apps/api-python`)

### Server & Logging
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `APP_ENV` | Config | No | render.yaml | `development` | Set to `production` to disable `/docs` |
| `APP_HOST` | Config | No | .env | `0.0.0.0` | Bind address |
| `APP_PORT` | Config | No | .env | `8000` | Local dev port (Render uses $PORT) |
| `LOG_LEVEL` | Config | No | render.yaml | `INFO` | Python logging level |

### Network & Inter-Service
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `CORS_ALLOWED_ORIGINS` | Config | No | render.yaml | `http://localhost:5173` | Frontend origin(s) for CORS |
| `INTERNAL_JAVA_API_URL` | Config | No | render.yaml | `http://localhost:8080` | For Python → Java calls |

### Vector Store / RAG Persistence
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `VECTOR_STORE_TYPE` | Config | No | render.yaml | `memory` | `memory` (lost on restart) or `pgvector` (persistent) |
| `DATABASE_URL` | Secret | If pgvector | render.yaml | — | PostgreSQL async URL: `postgresql://user:pass@host:6543/postgres?sslmode=require` |
| `PGVECTOR_TABLE` | Config | No | render.yaml | `rag_chunks` | Table name for RAG chunks |
| `RAG_AUTO_INGEST` | Config | No | .env | `true` | Auto-load docs on startup if store empty |

### LLM / AI Provider
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `LLM_PROVIDER` | Config | No | render.yaml | `""` (empty) | Provider: `openai`, `gemini`, `anthropic`, `llama`, or `""` (EchoClient) |
| `LLM_TIMEOUT` | Config | No | .env | `30` | Timeout in seconds |
| `LLM_MAX_TOKENS` | Config | No | .env | `1024` | Max tokens in response |
| `LLM_TEMPERATURE` | Config | No | .env | `0.3` | Temperature (0–1) |

### Task-Based LLM Routing
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `LLM_PROVIDER_REASONING` | Config | No | render.yaml | `""` | Provider for advisors (shipping, tracking) |
| `LLM_PROVIDER_SYNTHESIS` | Config | No | render.yaml | `""` | Provider for RAG q&a, recommendations |
| `LLM_PROVIDER_FALLBACK` | Config | No | render.yaml | `echo` | Fallback if task provider unavailable |

### OpenAI (if LLM_PROVIDER=openai)
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `OPENAI_API_KEY` | Secret | If openai | Render | — | API key from https://platform.openai.com/api/keys |
| `OPENAI_MODEL` | Config | No | .env | `gpt-4o-mini` | Model to use |

### Google Gemini (if LLM_PROVIDER=gemini)
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `GEMINI_API_KEY` | Secret | If gemini | Render | — | API key from https://ai.google.dev/ |
| `GEMINI_MODEL` | Config | No | .env | `gemini-2.0-flash` | Model to use |

### Anthropic / Claude (if LLM_PROVIDER=anthropic)
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `ANTHROPIC_API_KEY` | Secret | If anthropic | Render | — | API key from https://console.anthropic.com/ |
| `ANTHROPIC_MODEL` | Config | No | .env | `claude-sonnet-4-5` | Model to use |

### Llama (if LLM_PROVIDER=llama)
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `LLAMA_BASE_URL` | Config | No | .env | `http://localhost:11434` | Ollama server URL |
| `LLAMA_MODEL` | Config | No | .env | `llama3.2` | Model name |

### Embeddings / Semantic Search
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `EMBEDDING_PROVIDER` | Config | No | render.yaml | `""` (empty) | Provider: `openai` or `""` (LocalHashEmbedding) |
| `EMBEDDING_MODEL` | Config | No | render.yaml | `text-embedding-3-small` | Model name (if using OpenAI) |
| `EMBEDDING_DIMENSIONS` | Config | No | render.yaml | `1536` | Vector dimension (must match pgvector table) |

### RAG / Knowledge Base
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `RAG_DOCUMENTS_PATH` | Config | No | render.yaml | `data/documents` | Path to knowledge base documents |
| `RAG_TOP_K` | Config | No | .env | `3` | Number of chunks to retrieve per query |
| `RAG_CHUNK_SIZE` | Config | No | .env | `500` | Characters per chunk |
| `RAG_CHUNK_OVERLAP` | Config | No | .env | `50` | Overlap between chunks |

### Shipping Providers
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `SHIPPING_PROVIDER` | Config | No | render.yaml | `mock` | Provider: `mock`, `ups`, `fedex`, `dhl`, `usps` |
| `ENABLE_TOOLS` | Config | No | render.yaml | `true` | Enable tool orchestration |

### UPS (if SHIPPING_PROVIDER=ups)
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `UPS_CLIENT_ID` | Secret | If ups | Render | — | Client ID from UPS Developer |
| `UPS_CLIENT_SECRET` | Secret | If ups | Render | — | Client secret from UPS |
| `UPS_ACCOUNT_NUMBER` | Secret | If ups | Render | — | UPS account number |
| `UPS_BASE_URL` | Config | No | .env | `https://onlinetools.ups.com` | API base URL |

### FedEx (if SHIPPING_PROVIDER=fedex)
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `FEDEX_CLIENT_ID` | Secret | If fedex | Render | — | Client ID from FedEx Developer |
| `FEDEX_CLIENT_SECRET` | Secret | If fedex | Render | — | Client secret from FedEx |
| `FEDEX_ACCOUNT_NUMBER` | Secret | If fedex | Render | — | FedEx account number |
| `FEDEX_BASE_URL` | Config | No | .env | `https://apis.fedex.com` | API base URL |

### DHL (if SHIPPING_PROVIDER=dhl)
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `DHL_API_KEY` | Secret | If dhl | Render | — | API key from DHL Developer |
| `DHL_API_SECRET` | Secret | If dhl | Render | — | API secret from DHL |
| `DHL_ACCOUNT_NUMBER` | Secret | If dhl | Render | — | DHL account number |
| `DHL_BASE_URL` | Config | No | .env | `https://express.api.dhl.com` | API base URL |

### USPS (if SHIPPING_PROVIDER=usps)
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `USPS_CLIENT_ID` | Secret | If usps | Render | — | Client ID from USPS Developer |
| `USPS_CLIENT_SECRET` | Secret | If usps | Render | — | Client secret from USPS |
| `USPS_BASE_URL` | Config | No | .env | `https://api.usps.com` | API base URL |

### Rate Limiting
| Variable | Type | Required | Source | Default | Notes |
|----------|------|----------|--------|---------|-------|
| `RATE_LIMIT_ADVISOR` | Config | No | .env | `10/minute` | Per-IP rate limit for advisors |
| `RATE_LIMIT_ORCHESTRATION` | Config | No | .env | `20/minute` | Per-IP rate limit for orchestration |

**File:** `app/core/config.py`

---

## Summary: What to Set in Render Dashboard

### Required (sync: false in render.yaml)
```
Frontend:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY

Java API:
  DATABASE_URL
  DATABASE_USERNAME
  DATABASE_PASSWORD
  SUPABASE_URL
  SUPABASE_JWT_SECRET
  SUPABASE_SERVICE_ROLE_KEY

Python API:
  DATABASE_URL (optional, only if using pgvector)
  OPENAI_API_KEY (optional, only if using real LLM)
```

### Already Set in render.yaml (auto-deployed)
```
Frontend:
  VITE_JAVA_API_BASE_URL
  VITE_PYTHON_API_BASE_URL
  VITE_APP_ENV
  VITE_USE_JAVA_* (all feature flags)

Java API:
  SPRING_PROFILES_ACTIVE
  REQUIRE_JWT_SECRET
  CORS_ALLOWED_ORIGINS
  INTERNAL_PYTHON_API_URL

Python API:
  APP_ENV
  LOG_LEVEL
  CORS_ALLOWED_ORIGINS
  INTERNAL_JAVA_API_URL
  LLM_PROVIDER
  EMBEDDING_PROVIDER
  RAG_DOCUMENTS_PATH
  SHIPPING_PROVIDER
  ENABLE_TOOLS
  (and many optional defaults)
```

---

## Best Practices

1. **Secrets**: Always use `sync: false` in render.yaml, then set in Render dashboard
2. **Defaults**: Check `.env.example` files for all available options
3. **Env Naming**: Match case exactly (e.g., `DATABASE_URL` not `database_url`)
4. **Local Dev**: Copy `.env.example` → `.env` and fill in values
5. **Production**: Use Render dashboard, never commit `.env` files

---

**Last Updated:** 2026-04-08  
**Status:** Ready for Deployment ✅
