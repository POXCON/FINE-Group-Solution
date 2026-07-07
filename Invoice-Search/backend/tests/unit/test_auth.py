"""Unit tests for app.core.auth (Microsoft Entra ID JWT verification)."""

from __future__ import annotations

import time

import httpx
import pytest
import respx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwk, jwt

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import Settings

_TENANT_ID = "555dafe8-9dde-4f98-ac9b-904e08b28c58"
_APP_ID = "76537176-b582-4055-8b3e-cf89e84e1c08"


async def test_auth_disabled_returns_dev_user(test_settings: Settings) -> None:
    user = await get_current_user(credentials=None, settings=test_settings)
    assert isinstance(user, AuthenticatedUser)
    assert user.user_id == "dev-user"


async def test_auth_enabled_without_credentials_raises_401(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_DISABLED", "false")
    settings = Settings()

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=None, settings=settings)

    assert exc_info.value.status_code == 401


@pytest.fixture
def rsa_key_pair() -> tuple[dict, dict]:
    """Generate an RSA key pair and matching JWK for token signing/verification."""
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_jwk = jwk.construct(pem_private, algorithm="RS256").to_dict()
    public_jwk["kid"] = "test-kid"
    public_jwk["use"] = "sig"
    return {"pem": pem_private, "kid": "test-kid"}, public_jwk


def _setup_entra_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.setenv("AZURE_TENANT_ID", _TENANT_ID)
    monkeypatch.setenv("AZURE_API_AUDIENCE", f"api://{_APP_ID}")


def _base_claims(settings: Settings) -> dict:
    return {
        "oid": "oid-123",
        "sub": "sub-999",
        "preferred_username": "user@example.com",
        "iss": settings.azure_issuer,
        "aud": f"api://{_APP_ID}",
        "exp": int(time.time()) + 3600,
        "nbf": int(time.time()) - 10,
    }


def _sign_token(claims: dict, private_info: dict) -> str:
    return jwt.encode(
        claims,
        private_info["pem"],
        algorithm="RS256",
        headers={"kid": private_info["kid"]},
    )


async def _call_with_token(token: str, settings: Settings, public_jwk: dict) -> AuthenticatedUser:
    with respx.mock:
        respx.get(settings.azure_jwks_uri).mock(
            return_value=httpx.Response(200, json={"keys": [public_jwk]})
        )
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        return await get_current_user(credentials=credentials, settings=settings)


async def test_admin_role_is_authorized(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    monkeypatch.setenv("REQUIRED_APP_ROLE", "admin")
    settings = Settings()

    claims = {**_base_claims(settings), "roles": ["admin"]}
    user = await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert user.user_id == "oid-123"
    assert user.roles == ("admin",)
    assert user.email == "user@example.com"


async def test_non_admin_role_raises_403(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    monkeypatch.setenv("REQUIRED_APP_ROLE", "admin")
    settings = Settings()

    claims = {**_base_claims(settings), "roles": ["store"]}
    with pytest.raises(HTTPException) as exc_info:
        await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert exc_info.value.status_code == 403


async def test_missing_roles_claim_raises_403_when_required(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    monkeypatch.setenv("REQUIRED_APP_ROLE", "admin")
    settings = Settings()

    with pytest.raises(HTTPException) as exc_info:
        await _call_with_token(
            _sign_token(_base_claims(settings), private_info), settings, public_jwk
        )

    assert exc_info.value.status_code == 403


async def test_bare_audience_is_accepted(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    settings = Settings()

    claims = {**_base_claims(settings), "aud": _APP_ID, "roles": ["admin"]}
    user = await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert user.user_id == "oid-123"


async def test_wrong_audience_raises_401(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    settings = Settings()

    claims = {**_base_claims(settings), "aud": "api://someone-else", "roles": ["admin"]}
    with pytest.raises(HTTPException) as exc_info:
        await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert exc_info.value.status_code == 401


async def test_wrong_issuer_raises_401(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    settings = Settings()

    claims = {**_base_claims(settings), "iss": "https://evil.example/v2.0", "roles": ["admin"]}
    with pytest.raises(HTTPException) as exc_info:
        await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert exc_info.value.status_code == 401


async def test_expired_token_raises_401(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    settings = Settings()

    claims = {**_base_claims(settings), "exp": int(time.time()) - 60, "roles": ["admin"]}
    with pytest.raises(HTTPException) as exc_info:
        await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert exc_info.value.status_code == 401


async def test_falls_back_to_sub_when_oid_absent(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    settings = Settings()

    claims = {**_base_claims(settings), "roles": ["admin"]}
    del claims["oid"]
    user = await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert user.user_id == "sub-999"


async def test_no_required_role_skips_role_check(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    settings = Settings()

    claims = {**_base_claims(settings), "roles": []}
    user = await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert user.user_id == "oid-123"
    assert user.roles == ()


async def test_auth_disabled_bypasses_role_check(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_DISABLED", "true")
    monkeypatch.setenv("REQUIRED_APP_ROLE", "admin")
    settings = Settings()

    user = await get_current_user(credentials=None, settings=settings)

    assert user.user_id == "dev-user"
    assert user.roles == ()


async def test_unknown_kid_raises_401(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    settings = Settings()

    other_jwk = {**public_jwk, "kid": "different-kid"}
    claims = {**_base_claims(settings), "roles": ["admin"]}
    with pytest.raises(HTTPException) as exc_info:
        await _call_with_token(_sign_token(claims, private_info), settings, other_jwk)

    assert exc_info.value.status_code == 401


async def test_malformed_token_raises_401(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _setup_entra_env(monkeypatch)
    settings = Settings()

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="not-a-jwt")
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=credentials, settings=settings)

    assert exc_info.value.status_code == 401


async def test_jwks_is_cached_across_calls(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_entra_env(monkeypatch)
    settings = Settings()

    claims = {**_base_claims(settings), "roles": ["admin"]}
    token = _sign_token(claims, private_info)

    with respx.mock:
        route = respx.get(settings.azure_jwks_uri).mock(
            return_value=httpx.Response(200, json={"keys": [public_jwk]})
        )
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        await get_current_user(credentials=creds, settings=settings)
        await get_current_user(credentials=creds, settings=settings)

    # Second verification must reuse the cached JWKS (single network fetch).
    assert route.call_count == 1
