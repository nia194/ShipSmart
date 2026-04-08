# ShipSmart Monorepo

Polyglot monorepo for the ShipSmart shipping comparison and management platform.

**Stack:** React 19 · Spring Boot 4.0.5 · FastAPI 0.135.3 · Supabase Postgres · Render

---

## Repository Structure

```
ShipSmart/
├── apps/
│   ├── web/                  React frontend (Vite + TypeScript + shadcn/ui)
│   ├── api-java/             Spring Boot backend (core transactional APIs)
│   └── api-python/           FastAPI backend (AI/orchestration workflows)
├── packages/
│   └── shared/               Shared TypeScript types (used by apps/web)
├── supabase/
│   ├── config.toml           Supabase project config
│   └── migrations/           SQL migrations (copy from Lovable project)
├── infra/
│   └── scripts/              Local dev scripts
├── docs/
│   ├── architecture.md       System design overview
│   ├── service-boundaries.md  Who owns what
│   ├── migration-from-lovable.md  Migration guide
│   ├── deployment-render.md  Render deployment guide
│   ├── migration-checklist.md Ordered migration steps
│   └── adr/                  Architecture Decision Records
├── nx.json                   Nx workspace config
├── package.json              Root pnpm workspace
├── pnpm-workspace.yaml       pnpm workspace definition
├── render.yaml               Render blueprint (3 services)
└── tsconfig.base.json        Shared TypeScript config
```

---

## Architecture

```
Browser (React SPA)
    ├── → apps/api-java  (Spring Boot)  — shipments, quotes, saved options, bookings
    └── → apps/api-python (FastAPI)     — RAG, advisors, tool orchestration, LLM routing
                   │                          │
                   │                          └── (optional) → Java API for quote hydration
                   ↓                          ↓
           Supabase Postgres (auth + transactional data + pgvector RAG store)
```

- **Java** owns core transactional data. Single writer for shipments/quotes/options.
- **Python** handles AI workflows: RAG retrieval, shipping/tracking advisors, recommendation scoring, tool orchestration, multi-provider LLM routing. It does not own DB tables, but it *reads* a `rag_chunks` pgvector table for persistent retrieval.
- **Supabase** is the database, auth provider, and pgvector host.
- **Frontend → both backends directly** (no API gateway).
- **Python → Java**: optional internal HTTP call to hydrate recommendations from real Java-side quotes by `shipment_request_id`.

### AI / RAG capabilities (api-python)

- **Multi-provider LLM router**: OpenAI, Anthropic Claude, Google Gemini, Llama via Ollama, Echo fallback. Per-task routing (`reasoning`, `synthesis`, `fallback`).
- **RAG pipeline**: pluggable embeddings (OpenAI / local hash placeholder) + pluggable vector store (in-memory or **Postgres + pgvector**). Auto-ingest on first boot.
- **Tool orchestration**: in-process tool registry (`validate_address`, `get_quote_preview`). Selection is deterministic (regex) with **LLM-assisted fallback** for natural-language queries.
- **Advisors**: shipping advisor and tracking advisor combine RAG context + tool results + LLM reasoning into structured responses.
- **Recommendation engine**: deterministic scoring (cheapest / fastest / best_value / balanced) with optional LLM summary; can hydrate inputs from the Java API.
- **Hardening**: per-IP rate limiting (slowapi), TTL caches, loud startup warnings when degraded modes (mock provider, hash embeddings, echo LLM) are active.

See `apps/api-python/README.md` for the full FastAPI service docs and `docs/` (gitignored, local-only study notes) for the deeper architectural narrative.

---

## Local Development

### Prerequisites

| Tool     | Version      | Install                                           |
|----------|--------------|---------------------------------------------------|
| Node.js  | 20+          | [nodejs.org](https://nodejs.org)                  |
| pnpm     | 9+           | `npm install -g pnpm`                             |
| Java     | 25           | SDKMAN: `sdk install java 25-open`                |
| Python   | 3.13         | `pyenv install 3.13` or system installer          |
| uv       | 0.6.5+       | `curl -LsSf https://astral.sh/uv/install.sh \| sh`|

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api-java/.env.example apps/api-java/.env
cp apps/api-python/.env.example apps/api-python/.env
```

Fill in actual values (Supabase URL, keys, DB connection).
Run the env checker:

```bash
bash infra/scripts/check-env.sh
```

### 3. Initialize Java Gradle wrapper (first time only)

```bash
cd apps/api-java
gradle wrapper --gradle-version 9.4.1
cd ../..
```

### 4. Start all services

```bash
# Start everything
bash infra/scripts/dev-start.sh all

# Or start individually via Nx
pnpm nx serve web         # → http://localhost:5173
pnpm nx serve api-java    # → http://localhost:8080
pnpm nx serve api-python  # → http://localhost:8000
```

### Service URLs (local)

| Service        | URL                              |
|----------------|----------------------------------|
| Frontend       | http://localhost:5173            |
| Java health    | http://localhost:8080/api/v1/health |
| Python health  | http://localhost:8000/health     |
| Python docs    | http://localhost:8000/docs       |
| Java actuator  | http://localhost:8080/actuator/health |

---

## Building

```bash
# Build all projects
pnpm build

# Build specific project
pnpm nx build web
pnpm nx build api-java
pnpm nx build api-python
```

---

## Testing

```bash
pnpm test                    # Run all tests
pnpm nx test web             # Frontend tests only
pnpm nx test api-java        # Java tests only
pnpm nx test api-python      # Python tests only
```

---

## Deployment (Render)

See `docs/deployment-render.md` for the full guide.

**Quick summary:**
1. Push to GitHub
2. Connect to Render via Blueprint (`render.yaml`)
3. Fill in environment variables per service in the Render dashboard
4. Services: `web` (Static Site), `api-java` (Web Service), `api-python` (Web Service)

---

## Per-app READMEs

Each app has its own README with setup, env vars, endpoints, and gotchas:

- [`apps/api-python/README.md`](apps/api-python/README.md) — FastAPI AI service
- [`apps/api-java/README.md`](apps/api-java/README.md) — Spring Boot transactional API
- [`apps/web/README.md`](apps/web/README.md) — React + Vite frontend

---

## Supabase migrations

SQL migrations live in `supabase/migrations/`. Notable additions:

- `20260408034204_create_rag_chunks.sql` — `vector` extension + `rag_chunks` table used by the FastAPI RAG store when `VECTOR_STORE_TYPE=pgvector`. Vector dimension is fixed at 1536 to match OpenAI `text-embedding-3-small`.

Apply with `supabase db push` (requires the Supabase CLI and a linked project).

---

## Version Notes

| Component     | Version  | Notes                                                          |
|---------------|----------|----------------------------------------------------------------|
| React         | 19.2.x   | Upgraded from Lovable (18.3). `react-day-picker` needs v9.    |
| TypeScript    | 5.9.x    | Latest stable.                                                 |
| Spring Boot   | 4.0.5    | Major release (Spring Framework 7). Verify GA before prod use. |
| Java          | 25       | Non-LTS (GA Sep 2025). Consider Java 21 LTS for long-term.    |
| Gradle        | 9.4.1    | Latest stable (9.5 not yet released).                          |
| FastAPI       | 0.135.3  | Stable.                                                        |
| Python        | 3.13     | Latest stable.                                                 |
| Nx            | 22.3     | Polyglot monorepo management.                                  |
| pnpm          | 9.x      | Workspace manager for JS/TS packages.                          |

---

## Contributing

- Keep `docs/service-boundaries.md` updated when responsibilities change.
- Add ADRs in `docs/adr/` for significant architectural decisions.
- Use TODO markers for unimplemented features: `// TODO: description`
- Do not add fake business logic — use clear placeholders.
