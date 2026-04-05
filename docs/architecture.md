# ShipSmart — Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                    React SPA (apps/web)                          │
│          Vite + TypeScript + shadcn/ui + Tailwind                │
└──────────────┬────────────────────┬──────────────────────────────┘
               │ HTTPS              │ HTTPS
               │ (core APIs)        │ (AI/orchestration)
               ▼                    ▼
┌──────────────────────┐  ┌─────────────────────────────┐
│  Spring Boot Java    │  │    FastAPI Python            │
│  (apps/api-java)     │  │    (apps/api-python)         │
│  Port 8080           │  │    Port 8000                 │
│                      │  │                              │
│  Owns:               │  │  Owns:                       │
│  - Shipments         │  │  - AI workflows              │
│  - Quotes            │  │  - Orchestration             │
│  - Saved options     │  │  - Address validation        │
│  - Auth validation   │  │  - Tracking analysis         │
│  - Core business     │  │  - Notification gen.         │
│    logic             │  │                              │
└──────────┬───────────┘  └──────────┬──────────────────┘
           │                          │
           │ Both services connect via
           │ the Supabase Postgres connection string
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Postgres                              │
│              (external — hosted on Supabase.com)                 │
│                                                                  │
│  Tables:                                                         │
│  - profiles          - user_roles                                │
│  - shipment_requests - quotes                                    │
│  - saved_options     - redirect_tracking                         │
│                                                                  │
│  Auth: Supabase Auth (JWT-based, used by frontend)               │
└─────────────────────────────────────────────────────────────────┘
```

## Service Responsibilities

| Service          | Owns                                              | Does NOT own                     |
|------------------|---------------------------------------------------|----------------------------------|
| `apps/web`       | UI, routing, local state, Supabase auth session   | Business logic, data mutations   |
| `apps/api-java`  | Shipments, quotes, saved options, auth validation | AI features, orchestration flows |
| `apps/api-python`| AI workflows, orchestration, analysis helpers     | Transactional data, core APIs    |
| Supabase         | Database, Auth, Edge Functions (legacy)           | Backend logic                    |

See `docs/service-boundaries.md` for detailed boundary decisions.

## Technology Choices

| Layer        | Technology              | Reason                                              |
|--------------|-------------------------|-----------------------------------------------------|
| Frontend     | React 19 + Vite + TS    | Lovable-generated, preserving existing investment   |
| Frontend UI  | shadcn/ui + Tailwind    | Already in Lovable project, production-quality      |
| Java API     | Spring Boot 4.0.5       | Strong typing, mature ecosystem for transactional   |
| Python API   | FastAPI 0.135.3         | Async-first, LLM-friendly, rapid AI iteration       |
| Database     | Supabase Postgres       | Already provisioned, auth integrated, edge-ready    |
| Build        | Nx 22.3 + pnpm 9        | Polyglot monorepo support, caching, task graph      |
| Deployment   | Render                  | Simple PaaS, supports Java/Python/Static, affordable|

## Data Flow: Quote Request

```
Frontend
  → POST /api/v1/shipments         (Java — creates shipment_request record)
  → GET  /api/v1/quotes?shipmentRequestId=...  (Java — returns stored quotes)
  → POST /api/v1/quotes/saved      (Java — saves user selection)
  ↔ POST /api/v1/orchestration/run (Python — optional AI ranking/recommendation)
```

## Environment Strategy

Each app has its own `.env.example`. In local dev, copy to `.env.local` (web) or `.env` (Java/Python).
On Render, set environment variables directly in the service dashboard.

No cross-service environment variable sharing — each service is independently configurable.

## TODO Items

- [ ] Define JWT validation strategy for Java API (Supabase JWTs)
- [ ] Decide on Edge Function migration timeline (see migration-from-lovable.md)
- [ ] Design carrier integration architecture (NOT in this skeleton)
- [ ] Define service-to-service auth if Java calls Python or vice versa
