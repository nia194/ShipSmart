"""
ShipSmart — FastAPI Python Service
Entry point for the AI/orchestration service.

Render start command:
  uvicorn app.main:app --host 0.0.0.0 --port $PORT

Local dev:
  uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import health, orchestration


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # TODO: Add startup logic here (e.g., initialise DB connection pool, warm up LLM client)
    print(f"[shipsmart-api-python] Starting in '{settings.app_env}' mode")
    yield
    # TODO: Add shutdown cleanup here
    print("[shipsmart-api-python] Shutting down")


app = FastAPI(
    title="ShipSmart Python API",
    description="AI/orchestration service for the ShipSmart shipping platform.",
    version=settings.app_version,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(orchestration.router, prefix="/api/v1")

# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {"service": "shipsmart-api-python", "version": settings.app_version}
