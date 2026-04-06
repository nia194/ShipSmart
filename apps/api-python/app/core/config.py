"""
Application configuration.
Settings are loaded from environment variables using pydantic-settings.
Set values in apps/api-python/.env for local dev.
In production (Render), set them via the Render dashboard.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_name: str = "shipsmart-api-python"
    app_version: str = "0.1.0"

    # ── Supabase ─────────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""

    # ── Internal service-to-service ─────────────────────────────────────────
    internal_java_api_url: str = "http://localhost:8080"

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_allowed_origins: str = "http://localhost:5173"

    # ── AI providers (placeholder) ────────────────────────────────────────────
    # TODO: Uncomment when LLM features are added
    # openai_api_key: str = ""
    # anthropic_api_key: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


# Singleton — import this wherever config is needed
settings = Settings()
