# Current System State

Reconstructed from actual repository contents on 2026-04-06.
Branch: `feature/1.3` (ahead of `main` by 1 commit: `607c80f Phase3-7 completed`).

---

## Services Overview

| Service | Tech | Status | Health Endpoint |
|---------|------|--------|-----------------|
| **shipsmart-web** | React 19 + Vite + Tailwind | Deployed (Render static site) | Root URL loads |
| **shipsmart-api-java** | Spring Boot 3.4.4 + PostgreSQL | Deployed (Render web service) | `GET /api/v1/health` |
| **shipsmart-api-python** | FastAPI 0.135.3 + uvicorn | Deployed (Render web service) | `GET /health` |
| **Supabase** | Auth + PostgreSQL | Active | N/A (managed) |

---

## Component Status Matrix

### Frontend (apps/web)

| Component | Status | Notes |
|-----------|--------|-------|
| Quote search form (3-step) | **Complete** | Origin/dest, dates, packages with validation |
| Quote results display | **Complete** | Prime + Private provider sections, expandable rows |
| Auth (login/signup) | **Complete** | Supabase Auth via `useAuth()` context |
| Saved options CRUD | **Complete** | Feature-flagged: Java API or Supabase edge functions |
| Booking redirect tracking | **Complete** | Feature-flagged: Java API or Supabase edge functions |
| Advisor page (shipping + tracking) | **Complete** | Calls Python FastAPI `/api/v1/advisor/*` |
| AI recommendation panel | **Complete** | Non-blocking; fails silently if Python API down |
| Feature flags (`VITE_USE_JAVA_*`) | **Active** | All set to `"true"` in Render production |
| Supabase edge function fallback | **Available** | Can revert flags to `"false"` to use legacy path |
| Dark mode | **Not implemented** | |
| Notification backend | **Not implemented** | SavedPage has local-only notification UI |

**Pages:** HomePage, SavedPage, AuthPage, AdvisorPage, NotFound (5 total)

### Spring Boot Java API (apps/api-java)

| Component | Status | Notes |
|-----------|--------|-------|
| `POST /api/v1/quotes` | **Complete** | Mock deterministic quotes, persists ShipmentRequest |
| `GET/POST/DELETE /api/v1/saved-options` | **Complete** | JWT-authenticated, user-scoped |
| `POST /api/v1/bookings/redirect` | **Complete** | Public, persists RedirectTracking |
| `GET /api/v1/health` | **Complete** | Used by Render health checks |
| `/actuator/health` | **Complete** | Spring Actuator |
| `GET/POST /api/v1/shipments` | **Stub only** | Controllers exist, services are TODO |
| JWT auth (Supabase) | **Complete** | HMAC-SHA verification, fallback unsigned decode for dev |
| Spring Security | **Complete** | Stateless, CSRF disabled, endpoint authorization |
| Global error handling | **Complete** | Structured JSON error responses |
| Request logging (MDC) | **Complete** | requestId in every log line |
| WebClient for Python API calls | **Not implemented** | TODO comment in AppConfig.java:42-46 |
| Rate limiting | **Not implemented** | |
| Real carrier API integration | **Not implemented** | All quotes are mock/hardcoded |

**Database tables:** `shipment_requests`, `saved_options`, `redirect_tracking` (+ Supabase-managed `profiles`, `user_roles`)
**Tests:** 28 JUnit 5 tests (7 QuoteService, 6 SavedOptionService, 4 BookingService, 3 BookingController, 5 SavedOptionController, 1 context smoke, 2 other)

### FastAPI Python API (apps/api-python)

| Component | Status | Notes |
|-----------|--------|-------|
| RAG pipeline (chunk, embed, store, retrieve) | **Complete** | In-memory vector store, auto-ingests on startup |
| LLM abstraction | **Complete** | EchoClient (default) or OpenAIClient |
| Embedding abstraction | **Complete** | LocalHashEmbedding (default) or OpenAIEmbedding |
| Tool system (registry, base, 2 tools) | **Complete** | ValidateAddressTool, GetQuotePreviewTool |
| Shipping provider abstraction | **Complete** | MockShippingProvider only |
| Shipping advisor endpoint | **Complete** | `POST /api/v1/advisor/shipping` |
| Tracking advisor endpoint | **Complete** | `POST /api/v1/advisor/tracking` |
| Recommendation endpoint | **Complete** | `POST /api/v1/advisor/recommendation` (deterministic scoring) |
| Orchestration endpoints | **Complete** | `POST /api/v1/orchestration/run`, `GET /tools` |
| RAG endpoints | **Complete** | `POST /api/v1/rag/query`, `POST /api/v1/rag/ingest` |
| TTL caching | **Complete** | recommendation_cache (300s), rag_cache (120s) |
| Request logging middleware | **Complete** | X-Request-Id header |
| Performance script | **Complete** | `scripts/perf_check.py` |
| Real LLM (OpenAI) | **Ready but not enabled** | Set `LLM_PROVIDER=openai` + API key |
| Real embeddings (OpenAI) | **Ready but not enabled** | Set `EMBEDDING_PROVIDER=openai` |
| Persistent vector store | **Not implemented** | In-memory only |
| Real shipping provider | **Not implemented** | Mock only |
| LLM-driven tool selection | **Not implemented** | Regex-based only |
| Multi-turn conversations | **Not implemented** | |
| Rate limiting | **Not implemented** | |

**Seed documents:** 2 files (`carrier-info.txt`, `shipping-faq.md`)
**Tests:** 110 pytest tests across 17 test modules

### Supabase

| Component | Status | Notes |
|-----------|--------|-------|
| Auth (email signup) | **Active** | Used by frontend and validated by Java API |
| PostgreSQL database | **Active** | System of record for all transactional data |
| Edge functions (5 implemented) | **Legacy/fallback** | `get-shipping-quotes`, `save-option`, `get-saved-options`, `remove-saved-option`, `generate-book-redirect` |
| Edge functions (9 placeholder) | **Never implemented** | AI/MCP stubs from Lovable: `ai-*`, `create-shipment-reminders`, `escalate-tracking-issue`, `find-dropoff-locations`, `import-tracking-from-email`, `validate-address` |

---

## What Is Real vs Mock

| Layer | Current | Production Path |
|-------|---------|-----------------|
| Shipping quotes | **Mock** (hardcoded carrier rates in Java QuoteService) | Real carrier APIs (UPS, FedEx, DHL) |
| LLM | **Mock** (EchoClient returns RAG context verbatim) | Set `LLM_PROVIDER=openai` + `OPENAI_API_KEY` |
| Embeddings | **Mock** (LocalHashEmbedding, hash-based, no semantics) | Set `EMBEDDING_PROVIDER=openai` |
| Vector store | **In-memory** (lost on restart, re-ingested from files) | Persistent store (Chroma, Qdrant, etc.) |
| Shipping provider (tools) | **Mock** (MockShippingProvider, synthetic rates) | Real carrier integration |
| Tool selection | **Regex-based** patterns | LLM-driven intent detection |
| User auth | **Real** (Supabase Auth + JWT) | Already production-ready |
| Database | **Real** (Supabase PostgreSQL) | Already production-ready |

---

## Deployment Configuration (render.yaml)

| Service | Plan | Build | Health Check |
|---------|------|-------|--------------|
| shipsmart-web | Static site | `pnpm install && pnpm build` | Root URL |
| shipsmart-api-java | Starter | `./gradlew build -x test` | `/api/v1/health` |
| shipsmart-api-python | Starter | `pip install uv && uv sync` | `/health` |

**Feature flags in production:** All three `VITE_USE_JAVA_*` flags set to `"true"` (Java API active, Supabase edge functions available as fallback).

**Secrets managed in Render dashboard (not in render.yaml):**
- Supabase URL, anon key, service role key, JWT secret
- Database URL, username, password
- OpenAI API key (optional, not currently set)

---

## Test Summary

| Service | Framework | Count | Status |
|---------|-----------|-------|--------|
| api-python | pytest | 110 | All passing |
| api-java | JUnit 5 | 28 | All passing |
| web | Vitest | (configured but test count not verified) | |

---

## Key Mismatches: Docs vs Code

1. **Git history is sparse.** Only 12 commits total. Phases 3-13 were all done in a single commit (`607c80f Phase3-7 completed`), so git history does not reflect the phased development described in docs.

2. **ShipmentController is a stub.** Docs mention shipment endpoints but the controller methods are TODO with no service implementation.

3. **Java-to-Python communication not wired.** `INTERNAL_PYTHON_API_URL` is configured in both directions but neither service actually calls the other. The `WebClient` bean in Java's `AppConfig.java` is a TODO comment.

4. **No CI/CD pipeline exists.** No GitHub Actions workflows found despite docs mentioning it as a near-term priority.

5. **`production-env-matrix.md` is superseded** by `production-env-reference.md` but both exist.
