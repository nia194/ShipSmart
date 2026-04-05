/**
 * Central API configuration.
 * All service base URLs are sourced from environment variables.
 * Set these in apps/web/.env.local for local dev
 * and in Render environment settings for production.
 */

export const apiConfig = {
  /** Spring Boot Java backend — owns core transactional logic */
  javaApiBaseUrl: import.meta.env.VITE_JAVA_API_BASE_URL ?? "http://localhost:8080",

  /** FastAPI Python backend — AI/orchestration workflows */
  pythonApiBaseUrl: import.meta.env.VITE_PYTHON_API_BASE_URL ?? "http://localhost:8000",

  /** Supabase project URL */
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,

  /** Supabase anon key (public) */
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,

  appEnv: import.meta.env.VITE_APP_ENV ?? "development",
} as const;

/** Pre-built API path helpers */
export const javaApi = {
  health: () => `${apiConfig.javaApiBaseUrl}/api/v1/health`,
  shipments: () => `${apiConfig.javaApiBaseUrl}/api/v1/shipments`,
  quotes: () => `${apiConfig.javaApiBaseUrl}/api/v1/quotes`,
} as const;

export const pythonApi = {
  health: () => `${apiConfig.pythonApiBaseUrl}/health`,
  orchestration: () => `${apiConfig.pythonApiBaseUrl}/api/v1/orchestration`,
} as const;
