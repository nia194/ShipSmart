"""Health check route."""

from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str


@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health() -> HealthResponse:
    """
    Health check endpoint.
    Used by Render health checks and internal monitoring.
    """
    return HealthResponse(
        status="ok",
        service="shipsmart-api-python",
        version="0.1.0",
        timestamp=datetime.now(tz=timezone.utc).isoformat(),
    )
