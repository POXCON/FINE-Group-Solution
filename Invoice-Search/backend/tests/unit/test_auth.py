"""Unit tests for app.core.auth (Cognito JWT verification dependency)."""

from __future__ import annotations

import time

import httpx
import pytest
import respx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from jose import jwk, jwt

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import Settings


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


async def test_auth_enabled_with_valid_token_returns_user(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.setenv("COGNITO_USER_POOL_ID", "ap-northeast-1_TESTPOOL")
    monkeypatch.setenv("COGNITO_REGION", "ap-northeast-1")
    monkeypatch.setenv("COGNITO_APP_CLIENT_ID", "test-client-id")
    settings = Settings()

    token = jwt.encode(
        {
            "sub": "user-123",
            "email": "user@example.com",
            "iss": settings.cognito_issuer,
            "aud": "test-client-id",
            "exp": int(time.time()) + 3600,
        },
        private_info["pem"],
        algorithm="RS256",
        headers={"kid": private_info["kid"]},
    )

    with respx.mock:
        respx.get(settings.cognito_jwks_url).mock(
            return_value=httpx.Response(200, json={"keys": [public_jwk]})
        )

        from fastapi.security import HTTPAuthorizationCredentials

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = await get_current_user(credentials=credentials, settings=settings)

    assert user.user_id == "user-123"
    assert user.email == "user@example.com"


def _sign_token(claims: dict, private_info: dict) -> str:
    return jwt.encode(
        claims,
        private_info["pem"],
        algorithm="RS256",
        headers={"kid": private_info["kid"]},
    )


def _base_claims(settings: Settings) -> dict:
    return {
        "sub": "user-123",
        "email": "user@example.com",
        "iss": settings.cognito_issuer,
        "aud": "test-client-id",
        "exp": int(time.time()) + 3600,
    }


def _setup_cognito_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.setenv("COGNITO_USER_POOL_ID", "ap-northeast-1_TESTPOOL")
    monkeypatch.setenv("COGNITO_REGION", "ap-northeast-1")
    monkeypatch.setenv("COGNITO_APP_CLIENT_ID", "test-client-id")


async def _call_with_token(token: str, settings: Settings, public_jwk: dict) -> AuthenticatedUser:
    from fastapi.security import HTTPAuthorizationCredentials

    with respx.mock:
        respx.get(settings.cognito_jwks_url).mock(
            return_value=httpx.Response(200, json={"keys": [public_jwk]})
        )
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        return await get_current_user(credentials=credentials, settings=settings)


async def test_member_of_required_group_is_authorized(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_cognito_env(monkeypatch)
    monkeypatch.setenv("REQUIRED_COGNITO_GROUP", "invoice-search")
    settings = Settings()

    claims = {**_base_claims(settings), "cognito:groups": ["invoice-search"]}
    user = await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert user.user_id == "user-123"
    assert user.groups == ("invoice-search",)


async def test_non_member_of_required_group_raises_403(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_cognito_env(monkeypatch)
    monkeypatch.setenv("REQUIRED_COGNITO_GROUP", "invoice-search")
    settings = Settings()

    claims = {**_base_claims(settings), "cognito:groups": []}
    with pytest.raises(HTTPException) as exc_info:
        await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert exc_info.value.status_code == 403


async def test_missing_groups_claim_raises_403_when_required(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_cognito_env(monkeypatch)
    monkeypatch.setenv("REQUIRED_COGNITO_GROUP", "invoice-search")
    settings = Settings()

    with pytest.raises(HTTPException) as exc_info:
        await _call_with_token(
            _sign_token(_base_claims(settings), private_info), settings, public_jwk
        )

    assert exc_info.value.status_code == 403


async def test_auth_disabled_bypasses_group_check(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_DISABLED", "true")
    monkeypatch.setenv("REQUIRED_COGNITO_GROUP", "invoice-search")
    settings = Settings()

    user = await get_current_user(credentials=None, settings=settings)

    assert user.user_id == "dev-user"
    assert user.groups == ()


async def test_no_required_group_skips_group_check(
    monkeypatch: pytest.MonkeyPatch, rsa_key_pair: tuple[dict, dict]
) -> None:
    private_info, public_jwk = rsa_key_pair
    _setup_cognito_env(monkeypatch)
    settings = Settings()

    claims = {**_base_claims(settings), "cognito:groups": []}
    user = await _call_with_token(_sign_token(claims, private_info), settings, public_jwk)

    assert user.user_id == "user-123"
    assert user.groups == ()


async def test_auth_enabled_with_invalid_token_raises_401(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.setenv("COGNITO_USER_POOL_ID", "ap-northeast-1_TESTPOOL")
    settings = Settings()

    from fastapi.security import HTTPAuthorizationCredentials

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="not-a-jwt")

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=credentials, settings=settings)

    assert exc_info.value.status_code == 401
