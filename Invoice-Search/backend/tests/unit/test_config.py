"""Unit tests for app.core.config."""

from __future__ import annotations

import pytest

from app.core.config import Settings


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("true", True),
        ("True", True),
        ("1", True),
        ("yes", True),
        ("on", True),
        ("false", False),
        ("0", False),
        ("", False),
        ("garbage", False),
    ],
)
def test_debug_bool_parsing(monkeypatch: pytest.MonkeyPatch, raw: str, expected: bool) -> None:
    monkeypatch.setenv("DEBUG", raw)
    settings = Settings()
    assert settings.debug is expected


def test_cors_origins_parses_comma_separated_list(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "https://a.example.com, https://b.example.com")
    settings = Settings()
    assert settings.cors_origins == ["https://a.example.com", "https://b.example.com"]


def test_cors_origins_empty_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    settings = Settings()
    assert settings.cors_origins == []


def test_auth_disabled_defaults_true(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AUTH_DISABLED", raising=False)
    settings = Settings()
    assert settings.auth_disabled is True


def test_cognito_jwks_url_built_from_region_and_pool(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("COGNITO_REGION", "ap-northeast-1")
    monkeypatch.setenv("COGNITO_USER_POOL_ID", "ap-northeast-1_ABC123")
    settings = Settings()
    assert settings.cognito_jwks_url == (
        "https://cognito-idp.ap-northeast-1.amazonaws.com/"
        "ap-northeast-1_ABC123/.well-known/jwks.json"
    )
