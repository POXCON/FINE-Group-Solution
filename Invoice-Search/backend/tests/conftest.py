"""Shared pytest fixtures."""

from __future__ import annotations

from collections.abc import Iterator

import pytest

from app.core.config import Settings, get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Iterator[None]:
    """Ensure each test gets a fresh Settings instance."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def base_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("INVOICE_APP_ID", "test-app-id")
    monkeypatch.setenv("INVOICE_API_URL", "https://example.test/web-api/v1/announcement")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("AUTH_DISABLED", "true")
    monkeypatch.setenv("DEBUG", "false")


@pytest.fixture
def test_settings(base_env: None) -> Settings:
    return Settings()
