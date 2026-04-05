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
    ├── → apps/api-java  (Spring Boot)  — shipments, quotes, saved options
    └── → apps/api-python (FastAPI)     — AI workflows, orchestration
                   ↓
           Supabase Postgres (external)
```

- **Java** owns core transactional data. Single writer for the database.
- **Python** handles AI/orchestration. Does not own database tables.
- **Supabase** remains the database and auth provider.
- **No API gateway** at this stage — frontend calls both backends directly.

See `docs/architecture.md` and `docs/service-boundaries.md` for full details.

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
gradle wrapper --gradle-version 9.5
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

## Migration from Lovable

This monorepo is the migration target from the Lovable-generated project.
The Lovable code lives in `read-folder/blank-slate-project-main/`.

**Follow `docs/migration-from-lovable.md` for the step-by-step migration guide.**

Priority migration order:
1. Copy `src/` files into `apps/web/src/`
2. Copy `supabase/` folder (migrations + edge functions)
3. Run `pnpm nx serve web` and verify the app loads
4. Migrate Supabase Edge Functions to Java/Python APIs one at a time

---

## Version Notes

| Component     | Version  | Notes                                                          |
|---------------|----------|----------------------------------------------------------------|
| React         | 19.2.x   | Upgraded from Lovable (18.3). `react-day-picker` needs v9.    |
| TypeScript    | 5.9.x    | Latest stable.                                                 |
| Spring Boot   | 4.0.5    | Major release (Spring Framework 7). Verify GA before prod use. |
| Java          | 25       | Non-LTS (GA Sep 2025). Consider Java 21 LTS for long-term.    |
| Gradle        | 9.5      | Latest Gradle 9.x series.                                     |
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
