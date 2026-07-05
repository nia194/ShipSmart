# ShipSmart

AI-assisted shipping comparison platform: quote search across carriers, grounded shipping advice, a conversational concierge that fills the shipment form, compliance checks, and a human-reviewable multi-agent workflow — built as six focused services that ship independently and are verified together.

This repository is the **system view**: a read-only aggregate of the six component repositories, promoted here at stable milestones. Active development happens in the component repos; every directory below mirrors its repo's `main` at the exact commit recorded in [`COMPONENTS.yml`](./COMPONENTS.yml).

## Components

| Directory | Repository | Role | Stack |
|---|---|---|---|
| [`ShipSmart-Web/`](./ShipSmart-Web) | [ShipSmart-Web](https://github.com/nia194/ShipSmart-Web) | React SPA — quote comparison UI, concierge chat, advisor, workflow page | React 19 · Vite · TypeScript |
| [`ShipSmart-Orchestrator/`](./ShipSmart-Orchestrator) | [ShipSmart-Orchestrator](https://github.com/nia194/ShipSmart-Orchestrator) | Java transactional API — **single writer** to Postgres; quotes, bookings, saved options, carrier integration | Spring Boot 3.4 · Java 17 |
| [`ShipSmart-API/`](./ShipSmart-API) | [ShipSmart-API](https://github.com/nia194/ShipSmart-API) | Python AI/orchestration service — RAG, advisors, concierge agent, compliance, multi-agent workflow, multi-provider LLM router | FastAPI · Python 3.13 |
| [`ShipSmart-MCP/`](./ShipSmart-MCP) | [ShipSmart-MCP](https://github.com/nia194/ShipSmart-MCP) | MCP tool server — `validate_address`, `get_quote_preview`; provider-pluggable, read-only by policy | FastAPI + MCP |
| [`ShipSmart-Infra/`](./ShipSmart-Infra) | [ShipSmart-Infra](https://github.com/nia194/ShipSmart-Infra) | Supabase migrations + edge functions, deploy configs, infra validation, ops scripts | Supabase · Render |
| [`ShipSmart-Test/`](./ShipSmart-Test) | [ShipSmart-Test](https://github.com/nia194/ShipSmart-Test) | Cross-repo integration harness — contract suite, live e2e, cross-service Postman collection | Python 3.13 · pytest |

```
User ─► Web (React) ─► Orchestrator (Java, sole DB writer) ─► Supabase Postgres
              │                    ▲
              └─► API (FastAPI) ───┘   API ─► MCP (tools) · RAG corpus · LLM providers
                       Test harness exercises every boundary above
```

## Repository model

- **Component repos are canonical.** Features, fixes, PRs, and CI all happen there — each repo stands alone with its own tests and deploy config.
- **This repo is the promoted, stable snapshot.** When a component's `main` reaches a milestone, its mirror here is refreshed by [`scripts/sync-components.sh`](./scripts/sync-components.sh), which also records the source commit in `COMPONENTS.yml`. Mirrors are never edited directly — change the component repo, then promote.
- **`legacy/`** preserves the original pre-split monorepo and its first-deployment docs for historical reference.

## Running the system

Each component's README covers its own setup. To bring up the full stack locally (Java + Python + MCP + database) and run the cross-service suites, use [`ShipSmart-Test`](./ShipSmart-Test) — `scripts/run-stack.sh up`, then its contract and e2e suites.

## License

See [LICENSE](./LICENSE).
