"""Amazon Cognito JWT authentication dependency.

Verifies access/id tokens issued by an Amazon Cognito User Pool using
the pool's JWKS endpoint. When `AUTH_DISABLED=true` (the default for
local/dev environments where Cognito infra is not yet provisioned),
verification is bypassed and an anonymous dev user is returned.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JOSEError

from app.core.config import Settings, get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)

_DEV_USER_ID = "dev-user"


@dataclass(frozen=True)
class AuthenticatedUser:
    """Immutable representation of the authenticated principal."""

    user_id: str
    email: str | None = None
    groups: tuple[str, ...] = ()


class JWKSClient:
    """Fetches and caches a Cognito User Pool's JWKS document."""

    def __init__(self, jwks_url: str) -> None:
        self._jwks_url = jwks_url
        self._keys: dict[str, Any] | None = None

    async def get_keys(self) -> dict[str, Any]:
        if self._keys is None:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self._jwks_url)
                response.raise_for_status()
                self._keys = response.json()
        return self._keys

    def reset_cache(self) -> None:
        self._keys = None


_jwks_client_cache: dict[str, JWKSClient] = {}


def _get_jwks_client(settings: Settings) -> JWKSClient:
    client = _jwks_client_cache.get(settings.cognito_jwks_url)
    if client is None:
        client = JWKSClient(settings.cognito_jwks_url)
        _jwks_client_cache[settings.cognito_jwks_url] = client
    return client


def _find_signing_key(jwks: dict[str, Any], kid: str) -> dict[str, Any] | None:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def _verify_cognito_token(token: str, settings: Settings) -> AuthenticatedUser:
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JOSEError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    kid = unverified_header.get("kid")
    jwks_client = _get_jwks_client(settings)
    jwks = await jwks_client.get_keys()
    signing_key = _find_signing_key(jwks, kid) if kid else None

    if signing_key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.cognito_app_client_id or None,
            issuer=settings.cognito_issuer,
            options={"verify_aud": bool(settings.cognito_app_client_id)},
        )
    except JOSEError as exc:
        logger.warning("JWT verification failed", extra={"extra_fields": {"error": str(exc)}})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    groups = _extract_groups(claims)
    _enforce_required_group(groups, settings)

    return AuthenticatedUser(
        user_id=str(claims.get("sub", "")),
        email=claims.get("email"),
        groups=groups,
    )


def _extract_groups(claims: dict[str, Any]) -> tuple[str, ...]:
    """Extract the Cognito group memberships from the token claims."""
    raw_groups = claims.get("cognito:groups")
    if not isinstance(raw_groups, list):
        return ()
    return tuple(str(group) for group in raw_groups)


def _enforce_required_group(groups: tuple[str, ...], settings: Settings) -> None:
    """Reject principals that are not members of the required Cognito group.

    When `REQUIRED_COGNITO_GROUP` is empty, no group check is performed.
    The error message is intentionally generic to avoid leaking which group
    is required.
    """
    required = settings.required_cognito_group
    if required and required not in groups:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="アクセス権限がありません。",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    """FastAPI dependency that resolves the authenticated user.

    Bypassed entirely when `AUTH_DISABLED=true` for local/dev use before
    Cognito infrastructure is provisioned.
    """
    if settings.auth_disabled:
        return AuthenticatedUser(user_id=_DEV_USER_ID, email=None)

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return await _verify_cognito_token(credentials.credentials, settings)
