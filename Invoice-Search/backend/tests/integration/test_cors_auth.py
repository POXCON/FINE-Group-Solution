"""Integration tests for CORS middleware and Entra auth enforcement.

These guard the Container App deployment contract (#75):
  - CORS: the configured SWA origin is echoed back on preflight/simple
    requests; unknown origins are not allowed.
  - Auth: when ``AUTH_DISABLED=false`` a protected endpoint rejects
    token-less requests with 401.
"""

from __future__ import annotations

import importlib
from collections.abc import AsyncIterator

import httpx
import pytest

_ALLOWED_ORIGIN = "https://nice-water-054d5bc00.7.azurestaticapps.net"


def _build_client() -> httpx.AsyncClient:
    # `app.main` builds the CORS middleware from settings at import time, so
    # reload it under the patched env to make this test order-independent.
    import app.main as main_module

    main_module = importlib.reload(main_module)
    app = main_module.app
    app.dependency_overrides.clear()
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture
async def cors_client(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[httpx.AsyncClient]:
    monkeypatch.setenv("CORS_ORIGINS", _ALLOWED_ORIGIN)
    monkeypatch.setenv("AUTH_DISABLED", "true")
    async with _build_client() as client:
        yield client


@pytest.fixture
async def secured_client(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[httpx.AsyncClient]:
    monkeypatch.setenv("CORS_ORIGINS", _ALLOWED_ORIGIN)
    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.setenv("AZURE_TENANT_ID", "555dafe8-9dde-4f98-ac9b-904e08b28c58")
    monkeypatch.setenv("AZURE_API_AUDIENCE", "api://76537176-b582-4055-8b3e-cf89e84e1c08")
    monkeypatch.setenv("REQUIRED_APP_ROLE", "admin")
    async with _build_client() as client:
        yield client


async def test_preflight_allows_configured_swa_origin(cors_client: httpx.AsyncClient) -> None:
    response = await cors_client.options(
        "/api/invoice-search",
        headers={
            "Origin": _ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == _ALLOWED_ORIGIN
    assert response.headers["access-control-allow-credentials"] == "true"
    assert "POST" in response.headers["access-control-allow-methods"]


async def test_simple_request_echoes_allowed_origin(cors_client: httpx.AsyncClient) -> None:
    response = await cors_client.get("/", headers={"Origin": _ALLOWED_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == _ALLOWED_ORIGIN


async def test_unknown_origin_is_not_allowed(cors_client: httpx.AsyncClient) -> None:
    response = await cors_client.get("/", headers={"Origin": "https://evil.example.com"})

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


async def test_protected_endpoint_rejects_missing_token(secured_client: httpx.AsyncClient) -> None:
    response = await secured_client.post(
        "/api/invoice-search", json={"invoiceNum": ["T1234567890123"]}
    )

    assert response.status_code == 401
