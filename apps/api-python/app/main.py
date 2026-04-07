"""
ShipSmart — FastAPI Python Service
Entry point for the AI/orchestration service.

Render start command:
  uvicorn app.main:app --host 0.0.0.0 --port $PORT

Local dev:
  uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import advisor, health, info, orchestration, rag
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.logging import get_logger, setup_logging
from app.core.middleware import RequestLoggingMiddleware
from app.llm.client import create_llm_client
from app.providers.mock_provider import MockShippingProvider
from app.rag.embeddings import create_embedding_provider
from app.rag.vector_store import create_vector_store
from app.tools.address_tools import ValidateAddressTool
from app.tools.quote_tools import GetQuotePreviewTool
from app.tools.registry import ToolRegistry

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info(
        "Starting %s v%s in '%s' mode",
        settings.app_name, settings.app_version, settings.app_env,
    )

    # Shared HTTP client for calling the Java API and external services
    app.state.http_client = httpx.AsyncClient(
        base_url=settings.internal_java_api_url,
        timeout=30.0,
    )

    # RAG pipeline components
    embedding_provider = create_embedding_provider()
    vector_store = create_vector_store()
    llm_client = create_llm_client()
    app.state.rag = {
        "embedding_provider": embedding_provider,
        "vector_store": vector_store,
        "llm_client": llm_client,
    }
    logger.info("RAG pipeline initialized (embedding=%s, llm=%s)",
                type(embedding_provider).__name__, type(llm_client).__name__)

    # Tool registry and provider
    shipping_provider = MockShippingProvider()
    tool_registry = ToolRegistry()
    tool_registry.register(ValidateAddressTool(shipping_provider))
    tool_registry.register(GetQuotePreviewTool(shipping_provider))
    app.state.tool_registry = tool_registry
    logger.info(
        "Tool registry initialized: %d tools, provider=%s",
        tool_registry.count(), shipping_provider.name,
    )

    yield

    await app.state.http_client.aclose()
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title="ShipSmart Python API",
    description="AI/orchestration service for the ShipSmart shipping platform.",
    version=settings.app_version,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── Error handlers ───────────────────────────────────────────────────────────
register_error_handlers(app)

# ── Middleware (order matters — last added runs first) ─────────────��──────────
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(info.router, prefix="/api/v1")
app.include_router(orchestration.router, prefix="/api/v1")
app.include_router(rag.router, prefix="/api/v1")
app.include_router(advisor.router, prefix="/api/v1")


# ── Root ─────────────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {"service": settings.app_name, "version": settings.app_version}
