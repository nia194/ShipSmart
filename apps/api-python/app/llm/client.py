"""
LLM client abstraction.
Provider-based configuration, env-driven keys, clean error handling.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod

from app.core.config import settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)


class LLMClient(ABC):
    """Abstract interface for LLM completion."""

    @abstractmethod
    async def complete(self, messages: list[dict[str, str]]) -> str:
        """Send messages to the LLM and return the text response."""


class OpenAIClient(LLMClient):
    """OpenAI chat completion client."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    async def complete(self, messages: list[dict[str, str]]) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.3,
                max_tokens=1024,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error("OpenAI API error: %s", e)
            raise AppError(status_code=502, message="LLM provider returned an error") from e


class EchoClient(LLMClient):
    """Placeholder LLM client that echoes the query back.

    WARNING: Not a real LLM. Used when no provider is configured.
    Returns a message explaining that no LLM is available.
    """

    def __init__(self) -> None:
        logger.warning(
            "Using EchoClient — no LLM provider configured. "
            "Set LLM_PROVIDER=openai and OPENAI_API_KEY for real completions."
        )

    async def complete(self, messages: list[dict[str, str]]) -> str:
        user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        return (
            "[LLM not configured] "
            "No LLM provider is set. The RAG pipeline retrieved context successfully, "
            "but cannot generate an answer without an LLM. "
            f"Set LLM_PROVIDER=openai to enable real completions.\n\nOriginal query: {user_msg}"
        )


def create_llm_client() -> LLMClient:
    """Factory: create the configured LLM client."""
    provider = settings.llm_provider.lower()

    if provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("LLM_PROVIDER=openai but OPENAI_API_KEY is not set")
        return OpenAIClient(api_key=settings.openai_api_key, model=settings.openai_model)

    # Default: echo placeholder
    return EchoClient()
