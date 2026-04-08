"""
Provider abstractions and factory for external service integrations.

Usage:
    from app.providers import create_shipping_provider
    provider = create_shipping_provider()  # reads SHIPPING_PROVIDER from config
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.providers.shipping_provider import ShippingProvider

logger = logging.getLogger(__name__)

# Provider name → module path, class name
_PROVIDER_REGISTRY: dict[str, tuple[str, str]] = {
    "mock": ("app.providers.mock_provider", "MockShippingProvider"),
    "ups": ("app.providers.ups_provider", "UPSProvider"),
    "fedex": ("app.providers.fedex_provider", "FedExProvider"),
    "dhl": ("app.providers.dhl_provider", "DHLProvider"),
    "usps": ("app.providers.usps_provider", "USPSProvider"),
}


def create_shipping_provider() -> ShippingProvider:
    """Factory: create the configured shipping provider.

    Reads SHIPPING_PROVIDER from config. If the requested provider
    cannot be instantiated (missing credentials, import error, etc.),
    falls back to MockShippingProvider with a warning.
    """
    provider_name = settings.shipping_provider.lower().strip()

    if provider_name == "mock" or provider_name == "":
        from app.providers.mock_provider import MockShippingProvider
        return MockShippingProvider()

    if provider_name not in _PROVIDER_REGISTRY:
        logger.warning(
            "Unknown SHIPPING_PROVIDER=%r — falling back to mock", provider_name,
        )
        from app.providers.mock_provider import MockShippingProvider
        return MockShippingProvider()

    module_path, class_name = _PROVIDER_REGISTRY[provider_name]

    try:
        import importlib
        module = importlib.import_module(module_path)
        provider_class = getattr(module, class_name)
        provider = provider_class()

        # Validate that required credentials are present
        if not _has_required_credentials(provider_name):
            logger.warning(
                "SHIPPING_PROVIDER=%s but required credentials are missing — "
                "falling back to mock. Check env vars.",
                provider_name,
            )
            from app.providers.mock_provider import MockShippingProvider
            return MockShippingProvider()

        logger.info("Created shipping provider: %s", provider_name)
        return provider

    except Exception as exc:
        logger.warning(
            "Failed to create provider %s: %s — falling back to mock",
            provider_name, exc,
        )
        from app.providers.mock_provider import MockShippingProvider
        return MockShippingProvider()


def _has_required_credentials(provider_name: str) -> bool:
    """Check if the required env vars are set for a given provider."""
    checks: dict[str, list[str]] = {
        "ups": [settings.ups_client_id, settings.ups_client_secret],
        "fedex": [settings.fedex_client_id, settings.fedex_client_secret],
        "dhl": [settings.dhl_api_key, settings.dhl_api_secret],
        "usps": [settings.usps_client_id, settings.usps_client_secret],
    }
    required = checks.get(provider_name, [])
    return all(v.strip() for v in required)
