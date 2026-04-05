# ADR 001 — Monorepo Setup

**Date:** 2026-04-05
**Status:** Accepted

## Context

We have a Lovable-generated React frontend and are adding a Spring Boot Java API and a FastAPI Python API.
We need a single repo that can host all three, with shared tooling, clean separation, and Render deployment support.

## Decision

Use an **Nx 22.3 + pnpm 9 polyglot monorepo**.

- pnpm workspaces manage JS/TS packages (`apps/web`, `packages/shared`)
- Nx manages all project targets including Java (via `nx:run-commands`) and Python (via `nx:run-commands`)
- Java and Python are Nx projects but NOT pnpm packages — they use their own build tools (Gradle, uv)

## Consequences

**Positive:**
- Single `nx run-many` command to build/test all services
- Nx caching reduces CI time
- Clear project.json per service with explicit build/serve/test targets
- pnpm workspace linking for shared TypeScript types

**Negative:**
- Nx does not natively optimise Java/Python builds (no byte-level caching)
- Java and Python developers must have Node + pnpm installed for monorepo tooling
- @nx/gradle plugin is not used (too much version risk for initial skeleton); can add later

## Alternatives Considered

- **Turborepo + pnpm** — Good for JS-only, but weak for Java/Python orchestration
- **Separate repos** — Simpler per-language, but harder to keep contracts in sync
- **Gradle multi-project** — Only works for Java; cannot host the full polyglot stack
