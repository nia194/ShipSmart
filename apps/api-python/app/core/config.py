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
    log_level: str = "INFO"

    # ── Supabase ─────────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""

    # ── Internal service-to-service ─────────────────────────────────────────
    internal_java_api_url: str = "http://localhost:8080"

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_allowed_origins: str = "http://localhost:5173"

    # ── LLM ──────────────────────────────────────────────────────────────────
    llm_provider: str = ""  # "openai" or "" (empty = not configured)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""

    # ── Embeddings ───────────────────────────────────────────────────────────
    embedding_provider: str = ""  # "openai" or "" (empty = local placeholder)
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 256

    # ── Vector store ─────────────────────────────────────────────────────────
    vector_store_type: str = "memory"  # "memory" only for now
    vector_store_path: str = ""

    # ── RAG ───────────────────────────────────────────────────────────────────
    rag_provider: str = ""
    rag_top_k: int = 3
    rag_chunk_size: int = 500
    rag_chunk_overlap: int = 50
    rag_documents_path: str = "data/documents"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


# Singleton — import this wherever config is needed
settings = Settings()
