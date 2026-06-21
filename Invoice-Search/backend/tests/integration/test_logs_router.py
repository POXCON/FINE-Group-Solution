"""Integration tests for the client log ingestion API route."""

from __future__ import annotations

from collections.abc import AsyncIterator

import httpx
import pytest


@pytest.fixture
async def client(base_env: None) -> AsyncIterator[httpx.AsyncClient]:
    from app.main import app

    app.dependency_overrides.clear()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def test_post_log_accepts_valid_payload(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/api/logs",
        json={"message": "something happened", "level": "INFO", "fileName": "App.tsx"},
    )
    assert response.status_code == 204


async def test_post_log_rejects_missing_message(client: httpx.AsyncClient) -> None:
    response = await client.post("/api/logs", json={"level": "INFO", "fileName": "App.tsx"})
    assert response.status_code == 422
