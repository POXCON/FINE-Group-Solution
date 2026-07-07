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


def test_azure_jwks_uri_derived_from_tenant(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JWKS_URI", raising=False)
    monkeypatch.setenv("AZURE_TENANT_ID", "tenant-abc")
    settings = Settings()
    assert settings.azure_jwks_uri == (
        "https://login.microsoftonline.com/tenant-abc/discovery/v2.0/keys"
    )


def test_azure_issuer_derived_from_tenant(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ISSUER", raising=False)
    monkeypatch.setenv("AZURE_TENANT_ID", "tenant-abc")
    settings = Settings()
    assert settings.azure_issuer == "https://login.microsoftonline.com/tenant-abc/v2.0"


def test_issuer_and_jwks_override_win(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AZURE_TENANT_ID", "tenant-abc")
    monkeypatch.setenv("ISSUER", "https://issuer.example/v2.0")
    monkeypatch.setenv("JWKS_URI", "https://issuer.example/keys")
    settings = Settings()
    assert settings.azure_issuer == "https://issuer.example/v2.0"
    assert settings.azure_jwks_uri == "https://issuer.example/keys"


def test_allowed_audiences_accepts_both_forms_from_api_uri(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AZURE_API_AUDIENCE", "api://app-id-123")
    settings = Settings()
    assert set(settings.allowed_audiences) == {"api://app-id-123", "app-id-123"}


def test_allowed_audiences_accepts_both_forms_from_bare_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AZURE_API_AUDIENCE", "app-id-123")
    settings = Settings()
    assert set(settings.allowed_audiences) == {"api://app-id-123", "app-id-123"}


def test_allowed_audiences_empty_when_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AZURE_API_AUDIENCE", raising=False)
    settings = Settings()
    assert settings.allowed_audiences == ()
