"""Integration tests for the invoice search API route."""

from __future__ import annotations

from collections.abc import AsyncIterator

import httpx
import pytest
import respx

from app.core.config import get_settings


@pytest.fixture
async def client(base_env: None) -> AsyncIterator[httpx.AsyncClient]:
    # Import app lazily so it reads patched env vars via settings dependency.
    from app.main import app

    app.dependency_overrides.clear()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@respx.mock
async def test_post_invoice_search_returns_results(client: httpx.AsyncClient) -> None:
    settings = get_settings()
    respx.get(settings.invoice_api_url).mock(
        return_value=httpx.Response(
            200,
            json={
                "announcement": [
                    {
                        "registratedNumber": "T1234567890123",
                        "name": "テスト株式会社",
                        "address": "東京都千代田区",
                    }
                ]
            },
        )
    )

    response = await client.post("/api/invoice-search", json={"invoiceNum": ["T1234567890123"]})

    assert response.status_code == 200
    body = response.json()
    assert body["results"][0]["invoiceNumber"] == "T1234567890123"
    assert body["results"][0]["name"] == "テスト株式会社"


async def test_post_invoice_search_rejects_invalid_number(client: httpx.AsyncClient) -> None:
    response = await client.post("/api/invoice-search", json={"invoiceNum": ["abc"]})
    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid request."}


@respx.mock
async def test_post_invoice_search_returns_502_on_upstream_failure(
    client: httpx.AsyncClient,
) -> None:
    settings = get_settings()
    respx.get(settings.invoice_api_url).mock(return_value=httpx.Response(500))

    response = await client.post("/api/invoice-search", json={"invoiceNum": ["T1234567890123"]})

    assert response.status_code == 502
    detail = response.json()["detail"]
    assert "internal" not in detail.lower()
    assert "traceback" not in detail.lower()


async def test_root_endpoint_ok(client: httpx.AsyncClient) -> None:
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
