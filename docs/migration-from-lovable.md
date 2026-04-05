# ShipSmart — Migration from Lovable Project

This document describes exactly what to copy from the Lovable project
(`read-folder/blank-slate-project-main/`) into the ShipSmart monorepo,
and what to change during the process.

---

## Source → Destination Mapping

### Frontend Files (copy to `apps/web/`)

| Lovable Source                          | ShipSmart Destination                    | Action           |
|-----------------------------------------|------------------------------------------|------------------|
| `src/App.tsx`                           | `apps/web/src/App.tsx`                   | Replace skeleton |
| `src/main.tsx`                          | `apps/web/src/main.tsx`                  | Replace skeleton |
| `src/index.css`                         | `apps/web/src/index.css`                 | Replace skeleton |
| `src/App.css`                           | `apps/web/src/App.css`                   | Replace skeleton |
| `src/styles/shipsmart.css`              | `apps/web/src/styles/shipsmart.css`      | Copy as-is       |
| `src/vite-env.d.ts`                     | `apps/web/src/vite-env.d.ts`             | Replace (updated)|
| `src/components/NavLink.tsx`            | `apps/web/src/components/NavLink.tsx`    | Copy as-is       |
| `src/components/shipping/*`             | `apps/web/src/components/shipping/`      | Copy all         |
| `src/components/ui/*`                   | `apps/web/src/components/ui/`            | Copy all         |
| `src/pages/AuthPage.tsx`                | `apps/web/src/pages/AuthPage.tsx`        | Copy, then update|
| `src/pages/HomePage.tsx`                | `apps/web/src/pages/HomePage.tsx`        | Copy, then update|
| `src/pages/Index.tsx`                   | `apps/web/src/pages/Index.tsx`           | Copy as-is       |
| `src/pages/NotFound.tsx`                | `apps/web/src/pages/NotFound.tsx`        | Copy as-is       |
| `src/pages/SavedPage.tsx`               | `apps/web/src/pages/SavedPage.tsx`       | Copy as-is       |
| `src/contexts/AuthContext.tsx`          | `apps/web/src/contexts/AuthContext.tsx`  | Copy as-is       |
| `src/hooks/use-mobile.tsx`              | `apps/web/src/hooks/use-mobile.tsx`      | Copy as-is       |
| `src/hooks/use-toast.ts`               | `apps/web/src/hooks/use-toast.ts`        | Copy as-is       |
| `src/hooks/useSavedOptions.ts`          | `apps/web/src/hooks/useSavedOptions.ts`  | Copy, then update|
| `src/hooks/useShippingQuotes.ts`        | `apps/web/src/hooks/useShippingQuotes.ts`| Copy, then update|
| `src/lib/ai-types.ts`                   | `apps/web/src/lib/ai-types.ts`           | Copy, then update|
| `src/lib/shipping-data.ts`              | `apps/web/src/lib/shipping-data.ts`      | Copy, then update|
| `src/lib/utils.ts`                      | `apps/web/src/lib/utils.ts`              | Copy as-is       |
| `src/integrations/supabase/types.ts`    | `apps/web/src/integrations/supabase/types.ts` | Copy as-is  |
| `public/favicon.ico`                    | `apps/web/public/favicon.ico`            | Copy as-is       |
| `public/placeholder.svg`               | `apps/web/public/placeholder.svg`        | Copy as-is       |
| `public/robots.txt`                     | `apps/web/public/robots.txt`             | Copy as-is       |
| `tailwind.config.ts`                    | `apps/web/tailwind.config.ts`            | Replace skeleton |
| `components.json`                       | `apps/web/components.json`               | Already created  |

### Files NOT to copy

| Lovable File              | Reason                                               |
|---------------------------|------------------------------------------------------|
| `package.json`            | New one is already created for the monorepo         |
| `vite.config.ts`          | New one already created (lovable-tagger removed)    |
| `bun.lock` / `bun.lockb`  | Switching from bun to pnpm                          |
| `package-lock.json`       | Not used in pnpm workspace                          |
| `.env`                    | Secrets — never copy; set in `.env.local` manually  |
| `.lovable/`               | Lovable-specific metadata, not needed               |
| `playwright-fixture.ts`   | Keep if you want E2E tests; add to `apps/web/`      |
| `playwright.config.ts`    | Keep if you want E2E tests; add to `apps/web/`      |
| `src/test/`               | Keep if you want unit tests; update imports          |
| `vitest.config.ts`        | Already handled by Nx + Vite plugin                 |

---

## Supabase Files

| Lovable Source                     | ShipSmart Destination              | Action                |
|------------------------------------|------------------------------------|-----------------------|
| `supabase/config.toml`             | `supabase/config.toml`             | Replace skeleton      |
| `supabase/migrations/*`            | `supabase/migrations/`             | Copy all migrations   |
| `supabase/functions/*`             | `supabase/functions/`              | Copy, mark as legacy  |

**Edge Functions:** Copy all existing edge functions as-is. Mark them with a comment:
```typescript
// LEGACY: This function is a candidate for migration to api-java or api-python.
// See docs/service-boundaries.md for the migration plan.
// Do NOT modify this function; migrate and delete instead.
```

---

## Required Changes After Copying

### 1. Supabase client env var rename

In `apps/web/src/integrations/supabase/client.ts`:
```typescript
// OLD (Lovable):
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// NEW (ShipSmart):
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```
The ShipSmart skeleton already handles this in `src/integrations/supabase/client.ts`.
Just copy the `types.ts` file and restore the `Database` generic.

### 2. Remove lovable-tagger from vite.config.ts

Already done in the ShipSmart vite.config.ts. Do not re-add it.

### 3. Update react-day-picker import in any page that uses it

The Lovable project used `react-day-picker@^8.x` (React 18).
ShipSmart uses `react-day-picker@^9.x` (React 19 compatible).
The v9 API changed — update imports in `Calendar` component and any page using the date picker.

### 4. Update imports in hooks

`useSavedOptions.ts` and `useShippingQuotes.ts` call Supabase Edge Functions directly.
After migration to Java API:
- Update `useShippingQuotes.ts` to call `VITE_JAVA_API_BASE_URL/api/v1/quotes`
- Update `useSavedOptions.ts` to call `VITE_JAVA_API_BASE_URL/api/v1/quotes/saved`
- Keep Edge Function calls as a fallback during transition

---

## Migration Order (Recommended)

1. Copy all `src/` files into `apps/web/src/`
2. Copy `public/` assets
3. Copy and update `tailwind.config.ts`
4. Copy `supabase/` folder
5. Install dependencies: `pnpm install` from monorepo root
6. Run `pnpm nx serve web` and verify the app loads
7. Fix any import errors (mostly the env var rename and react-day-picker update)
8. Begin migrating Edge Functions to Java/Python APIs one at a time

---

## Post-Migration Verification Checklist

- [ ] `pnpm nx serve web` — app loads without errors
- [ ] Auth flow works (login/signup via Supabase)
- [ ] Quote display works (currently via Supabase Edge Functions)
- [ ] Saved options work
- [ ] No `lovable-tagger` errors in console
- [ ] `VITE_SUPABASE_ANON_KEY` env var is set correctly
