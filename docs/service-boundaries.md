# ShipSmart — Service Boundary Decisions

This document records explicit decisions about which service owns which responsibilities.
Update this document when boundaries change.

---

## Rule 1: Java owns the system-of-record

**Spring Boot (api-java) is the authoritative source for:**
- `shipment_requests` table
- `quotes` table
- `saved_options` table
- `redirect_tracking` table
- `user_roles` table
- `profiles` table

Java is the single writer for transactional data. FastAPI does NOT write to these tables directly.

**Rationale:** Avoids dual-write conflicts. Java's type system and ORM support makes transactional
integrity easier to guarantee.

---

## Rule 2: FastAPI is for AI/orchestration, not core APIs

**FastAPI (api-python) handles:**
- LLM-backed recommendation workflows (when implemented)
- Address validation (third-party or AI-assisted)
- Tracking issue analysis and escalation
- Email parsing for tracking imports
- Notification generation

**FastAPI does NOT:**
- Own database tables directly (may read via Supabase or via Java API)
- Accept payment or booking requests
- Duplicate endpoints already in Java

**Rationale:** Python's async ecosystem and LLM SDKs are a better fit for AI workloads.
Keeping these separate allows the AI layer to evolve independently.

---

## Rule 3: Frontend calls both backends directly (not proxied)

The React frontend calls Java and Python APIs via environment variables:
- `VITE_JAVA_API_BASE_URL` — for core business APIs
- `VITE_PYTHON_API_BASE_URL` — for AI/orchestration workflows

There is no API gateway at this time. Add one if:
- Cross-service request aggregation is needed
- Rate limiting or auth enforcement needs centralisation

---

## Rule 4: Supabase Auth remains the auth provider

- Supabase handles user signup, login, session management
- The frontend receives a Supabase JWT
- The Java API validates Supabase JWTs using the `SUPABASE_JWT_SECRET`
- The Python API may also validate JWTs if needed

**No custom auth system is planned.** Supabase auth is retained from the Lovable project.

---

## Rule 5: Supabase Edge Functions — migration TBD

The Lovable project has these Edge Functions:
| Function                    | Recommended Migration Path                |
|-----------------------------|-------------------------------------------|
| `get-shipping-quotes`       | → Java API `/api/v1/quotes`               |
| `save-option`               | → Java API `/api/v1/quotes/saved` (POST)  |
| `get-saved-options`         | → Java API `/api/v1/quotes/saved` (GET)   |
| `remove-saved-option`       | → Java API `/api/v1/quotes/saved` (DELETE)|
| `generate-book-redirect`    | → Java API (TBD)                          |
| `validate-address`          | → Python API `/api/v1/orchestration`      |
| `find-dropoff-locations`    | → Python API `/api/v1/orchestration`      |
| `ai-shipping-advisor`       | → Python API (AI workflow)                |
| `ai-tracking-advisor`       | → Python API (AI workflow)                |
| `ai-priority-interpreter`   | → Python API (AI workflow)                |
| `ai-notification-generator` | → Python API (AI workflow)                |
| `escalate-tracking-issue`   | → Python API (AI workflow)                |
| `import-tracking-from-email`| → Python API (AI workflow)                |
| `create-shipment-reminders` | → Java API or Supabase cron (TBD)         |

**Decision:** Keep Edge Functions active during migration. Migrate one at a time.
Do NOT remove a function until the replacement API is live and tested.

---

## Open Boundary Questions

- [ ] Should Java call Python internally, or should the frontend coordinate both?
  - Current default: frontend coordinates (two separate API calls)
  - Java-calls-Python is better for atomic workflows — decide when first workflow is defined

- [ ] How are carrier quote sources managed?
  - NOT in this skeleton. Define in ADR when carrier strategy is chosen.

- [ ] Should `redirect_tracking` move to Java or stay Supabase-side?
  - Currently Supabase Edge Function (`generate-book-redirect`)
  - Likely moves to Java when booking flow is built
