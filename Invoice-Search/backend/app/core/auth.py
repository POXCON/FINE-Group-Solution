"""Microsoft Entra ID JWT authentication dependency.

Verifies access tokens issued by Microsoft Entra ID (v2 endpoint) using
the tenant's JWKS document. When `AUTH_DISABLED=true` (the default for
local/dev environments where Entra infra is not yet wired up), verification
is bypassed and an anonymous dev user is returned.

Verification steps:
  1. Signature: RS256 against the Entra JWKS key selected by `kid`
     (JWKS is cached with a TTL, not fetched on every request).
  2. `iss` must equal the configured issuer.
  3. `aud` must be one of the allowed audiences (`api://<appId>` or `<appId>`).
  4. `exp` / `nbf` are validated by the JWT library.
  5. Authorization: `roles` must contain `REQUIRED_APP_ROLE`, else 403.
Invalid/missing tokens yield 401; missing role yields 403.
"""

from __future__ import annotations

import time
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
    roles: tuple[str, ...] = ()


class JWKSClient:
    """Fetches and caches an Entra tenant's JWKS document with a TTL."""

    def __init__(self, jwks_uri: str, ttl_seconds: int) -> None:
        self._jwks_uri = jwks_uri
        self._ttl_seconds = max(ttl_seconds, 0)
        self._keys: dict[str, Any] | None = None
        self._fetched_at: float = 0.0

    def _is_fresh(self) -> bool:
        return self._keys is not None and (time.monotonic() - self._fetched_at) < self._ttl_seconds

    async def get_keys(self) -> dict[str, Any]:
        if self._is_fresh() and self._keys is not None:
            return self._keys
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(self._jwks_uri)
            response.raise_for_status()
            keys: dict[str, Any] = response.json()
        self._keys = keys
        self._fetched_at = time.monotonic()
        return keys

    def reset_cache(self) -> None:
        self._keys = None
        self._fetched_at = 0.0


_jwks_client_cache: dict[str, JWKSClient] = {}


def _get_jwks_client(settings: Settings) -> JWKSClient:
    uri = settings.azure_jwks_uri
    client = _jwks_client_cache.get(uri)
    if client is None:
        client = JWKSClient(uri, settings.jwks_cache_ttl_seconds)
        _jwks_client_cache[uri] = client
    return client


def _find_signing_key(jwks: dict[str, Any], kid: str) -> dict[str, Any] | None:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def _resolve_signing_key(token: str, settings: Settings) -> dict[str, Any]:
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JOSEError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    kid = unverified_header.get("kid")
    jwks = await _get_jwks_client(settings).get_keys()
    signing_key = _find_signing_key(jwks, kid) if kid else None
    if signing_key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return signing_key


def _decode_claims(token: str, signing_key: dict[str, Any], settings: Settings) -> dict[str, Any]:
    """Verify signature, issuer, expiry/nbf, and audience.

    Audience is checked manually so that both `api://<appId>` and the bare
    `<appId>` forms are accepted.
    """
    try:
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=settings.azure_issuer,
            options={"verify_aud": False},
        )
    except JOSEError as exc:
        logger.warning("JWT verification failed", extra={"extra_fields": {"error": str(exc)}})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    _enforce_audience(claims, settings)
    return claims


def _enforce_audience(claims: dict[str, Any], settings: Settings) -> None:
    allowed = settings.allowed_audiences
    if not allowed:
        return
    if str(claims.get("aud", "")) not in allowed:
        logger.warning("JWT audience mismatch")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def _extract_roles(claims: dict[str, Any]) -> tuple[str, ...]:
    """Extract the Entra App Role assignments from the token claims."""
    raw_roles = claims.get("roles")
    if not isinstance(raw_roles, list):
        return ()
    return tuple(str(role) for role in raw_roles)


def _enforce_required_role(roles: tuple[str, ...], settings: Settings) -> None:
    """Reject principals lacking the required App Role.

    When `REQUIRED_APP_ROLE` is empty, no role check is performed. The error
    message is intentionally generic to avoid leaking which role is required.
    """
    required = settings.required_app_role
    if required and required not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="アクセス権限がありません。",
        )


async def _verify_entra_token(token: str, settings: Settings) -> AuthenticatedUser:
    signing_key = await _resolve_signing_key(token, settings)
    claims = _decode_claims(token, signing_key, settings)

    roles = _extract_roles(claims)
    _enforce_required_role(roles, settings)

    user_id = str(claims.get("oid") or claims.get("sub") or "")
    return AuthenticatedUser(
        user_id=user_id,
        email=claims.get("email") or claims.get("preferred_username"),
        roles=roles,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    """FastAPI dependency that resolves the authenticated user.

    Bypassed entirely when `AUTH_DISABLED=true` for local/dev use before
    Entra infrastructure is provisioned.
    """
    if settings.auth_disabled:
        return AuthenticatedUser(user_id=_DEV_USER_ID, email=None)

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return await _verify_entra_token(credentials.credentials, settings)
