// TODO: [MIGRATION] This file mirrors the structure of the Lovable supabase client.
// After migration, replace the type import with the migrated Database type from ./types.ts

import { createClient } from "@supabase/supabase-js";
import { apiConfig } from "@/config/api";

// NOTE: Renamed from VITE_SUPABASE_PUBLISHABLE_KEY (Lovable) to VITE_SUPABASE_ANON_KEY (ShipSmart).
// Update your .env.local and Render env vars accordingly.

if (!apiConfig.supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is not set. Check apps/web/.env.local");
}
if (!apiConfig.supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY is not set. Check apps/web/.env.local");
}

// TODO: [MIGRATION] Restore the Database generic type after copying types.ts from Lovable:
//   import type { Database } from "./types";
//   export const supabase = createClient<Database>(...)

export const supabase = createClient(apiConfig.supabaseUrl, apiConfig.supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
