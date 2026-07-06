# ShipSmart

**A shipping search and comparison platform with an AI copilot** — compare real carrier quotes, get grounded shipping advice with citations, fill the shipment form by chatting, run compliance checks, and route risky cases through a human-reviewable multi-agent workflow. Built as six focused services that develop and deploy independently and are verified together by a cross-repo test harness.

This repository is the **system view**: a read-only aggregate of the six component repositories, promoted here at stable milestones. Active development happens in the component repos; every mirror directory below equals its repo's `main` at the exact commit recorded in [`COMPONENTS.yml`](./COMPONENTS.yml).

---

## Table of contents

- [What the product does](#what-the-product-does)
- [Architecture](#architecture)
- [Components](#components)
- [Cross-cutting engineering](#cross-cutting-engineering)
- [Repository model](#repository-model)
- [Running the system](#running-the-system)
- [Where it is heading](#where-it-is-heading)
- [License](#license)

---

## What the product does

| Capability | How |
|---|---|
| **Quote search & comparison** | Submit a shipment, get carrier service quotes (real FedEx Rate API integration, sandbox by default, plus mock providers behind one `QuoteProvider` seam), compared with scored ranking and per-option insights. |
| **Saved options & analytics** | Authenticated CRUD on saved shipping options, with per-user groupings — carriers, tiers, price top-N, route frequency. |
| **Booking hand-off** | Idempotent carrier booking redirect with tracking, backed by stored quote data — never by model output. |
| **Grounded shipping advisor** | Shipment-scoped Q&A over a curated 19-document corpus (compliance, carrier, packaging, customs guides) with citations, provenance badges, and explicit refusal when the corpus can't support an answer. |
| **Conversational concierge** | Multi-turn chat that fills the shipment form: extracted slots patch a shared draft the form and chat both edit, with "from chat" provenance and conflict confirmation. |
| **Compliance checks** | Restricted/prohibited-item and destination checks over the same corpus (UC2), surfaced as explicit verdicts. |
| **Multi-agent workflow** | A shipment run through specialist agents that can suspend on unverified high-risk areas for a human reviewer to clear or block (UC3/UC4). |
| **MCP tools** | `validate_address` and `get_quote_preview` exposed over MCP/HTTP for any MCP-capable client — read-only by enforced policy. |

## Architecture

```
                ┌─────────────────────────────────────────────┐
                │            ShipSmart-Web · React SPA        │
                └──────────────┬───────────────────┬──────────┘
                               │  Bearer Supabase JWT          │
                               ▼                               ▼
     ┌──────────────────────────────┐        ┌──────────────────────────────┐
     │   ShipSmart-Orchestrator     │◀───────│         ShipSmart-API        │
     │   Java / Spring Boot         │        │       Python / FastAPI       │
     │   SOLE writer to Postgres    │        │  RAG · advisors · concierge  │
     │   quotes · bookings · saved  │        │  compliance · workflow · LLM │
     └──────────────┬───────────────┘        └──────────────┬───────────────┘
                    │                                       ▼
                    ▼                        ┌──────────────────────────────┐
     ┌──────────────────────────────┐        │        ShipSmart-MCP         │
     │  Supabase Postgres + Auth    │        │  shipping tools (HTTP/MCP)   │
     └──────────────────────────────┘        └──────────────────────────────┘
            ShipSmart-Infra: migrations · edge functions · deploy configs
            ShipSmart-Test: cross-repo contract suite · live e2e harness
```

**Ownership rules the system is built on:**

- **Java is the single writer.** Every transactional fact (quotes, bookings, saved options, shipments) is created and validated by the Orchestrator; the Python service reads through it over internal HTTP and never touches the database directly.
- **Deterministic decisions, generative explanations.** Scoring, ranking, compliance verdicts, and routing are code; the LLM extracts fuzzy intent and writes concise explanations. No model output creates a price, a booking, or a form mutation on its own.
- **The AI boundary is the FastAPI service.** Prompt assembly, injection detection, untrusted-data fencing, grounding/refusal, and decision-tag tracing live in one guardrail funnel that every prompt flows through.
- **Tools are contained.** Model-initiated actions execute only through the MCP server's schema-validated, allowlisted, read-only tool registry — the model never calls carriers directly.
- **Graceful degradation.** Carrier fallback paths (legacy Supabase edge functions), LLM provider failover down to a keyless echo mode, and advisor errors that never affect the quote/booking path.

## Components

| Directory | Repository | Role | Stack | Verified tests |
|---|---|---|---|---|
| [`ShipSmart-Web/`](./ShipSmart-Web) | [repo](https://github.com/nia194/ShipSmart-Web) | React SPA — comparison UI, concierge chat, advisor, workflow page | React 19 · Vite · TS · Tailwind/shadcn · TanStack Query | 58 unit/component + browser smoke |
| [`ShipSmart-Orchestrator/`](./ShipSmart-Orchestrator) | [repo](https://github.com/nia194/ShipSmart-Orchestrator) | Transactional API — single Postgres writer, carrier integration, provider registry + metrics | Spring Boot 3.4 · Java 17 · JPA · Flyway (validate) · Caffeine · Bucket4j | 88 (81 run, 7 Docker-gated) |
| [`ShipSmart-API/`](./ShipSmart-API) | [repo](https://github.com/nia194/ShipSmart-API) | AI/orchestration — RAG (pgvector/hybrid), advisors, concierge agent, compliance, workflow, multi-provider LLM router | FastAPI · Python 3.13 · uv · pgvector | 445 hermetic, no keys |
| [`ShipSmart-MCP/`](./ShipSmart-MCP) | [repo](https://github.com/nia194/ShipSmart-MCP) | MCP tool server — address validation + quote preview over 5 pluggable shipping providers | FastAPI + MCP · Python 3.13 | 95 |
| [`ShipSmart-Infra/`](./ShipSmart-Infra) | [repo](https://github.com/nia194/ShipSmart-Infra) | Supabase migrations + edge functions, Render deploy configs, infra invariants validator, dev scripts | Supabase · Deno · Bash | invariant validator |
| [`ShipSmart-Test/`](./ShipSmart-Test) | [repo](https://github.com/nia194/ShipSmart-Test) | Cross-repo harness — contract suite over the five siblings' sources, live e2e against the boot-anything stack script, cross-service Postman collection | Python 3.13 · pytest · newman | 25 contract + 32 e2e |

## Cross-cutting engineering

- **Contracts, verified in CI.** ShipSmart-Test parses sibling sources as text and asserts the cross-boundary shapes line up — TypeScript types ↔ Pydantic schemas ↔ Java DTOs ↔ MCP tool schemas ↔ SQL function signatures — without booting five applications. Its CI checks out all six repos and runs the suite on every change.
- **Hermetic, keyless CI everywhere.** Echo/scripted LLM clients, mock shipping providers, in-memory vector store — every repo's suite runs green with zero external credentials.
- **AI guardrails as code.** Centralized prompt assembly, regex + heuristic injection detection, fenced untrusted data, grounded-or-refuse answers (`SAFE_REFUSAL`), output leakage checks, and `decisions[]` audit tags on every response.
- **Transactional integrity.** Idempotency keys on writes, ETag/`If-Match` optimistic concurrency, per-IP rate limiting, soft deletes, request-correlation IDs propagated from the browser through every service.
- **LLM provider strategy.** One router across OpenAI / Anthropic / Gemini / Ollama with task-based routing and failover, plus a scripted keyless client so demos and CI run the full agent loop with no API keys.
- **Operational surface.** Spring Actuator + Prometheus endpoint, provider call metrics with ring-buffer history (`GET /api/v1/providers/metrics`), health probes on every service, W3C trace headers minted at the edge.

## Repository model

- **Component repos are canonical.** Features, fixes, PRs, and CI happen there; each stands alone.
- **This repo is the promoted snapshot.** [`scripts/sync-components.sh`](./scripts/sync-components.sh) refreshes each root mirror from its component's `main` and records the source commit in [`COMPONENTS.yml`](./COMPONENTS.yml). Mirrors are never edited directly — change the component, then promote.
- **[`legacy/`](./legacy)** preserves the original pre-split monorepo and its first-deployment documentation for historical reference.

## Running the system

Each component README covers its own setup (env examples included, no secrets required for local mock modes). For the full stack — Postgres (pgvector), Java, Python API, MCP — use [`ShipSmart-Test`](./ShipSmart-Test):

```bash
cd ShipSmart-Test
scripts/run-stack.sh up      # boots db + all three services with test-safe env
uv run pytest                # 25 contract + 32 e2e against the live stack
```

The web app runs from [`ShipSmart-Web`](./ShipSmart-Web) with `pnpm dev` against those services.

## Where it is heading

Three engineering programs are specced and sequenced next: a **six-layer evaluation system** (contract, RAG-quality, agent/tool-use, adversarial safety, product-behavior, and online evals with calibrated human review), a **governance & guardrails control system** (structured typed outputs, PII/audit lifecycle, tool policy, incident kill-switches), and a **product roadmap** that turns the assistant into a typed-contract-driven shipping search experience — followed by observability, resilience, security-hardening, delivery, and performance workstreams.

## License

See [LICENSE](./LICENSE).
