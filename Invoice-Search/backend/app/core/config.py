"""Application configuration loaded from environment variables.

All secrets and environment-specific values MUST be provided via
environment variables (or AWS Secrets Manager in production), never
hardcoded. See `.env.example` for the full list of supported variables.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _str_to_bool(value: str) -> bool:
    """Parse a boolean-ish environment variable value safely.

    Accepts "true"/"1"/"yes"/"on" (case-insensitive) as True.
    Anything else (including empty string) is False.
    """
    return value.strip().lower() in {"true", "1", "yes", "on"}


class Settings(BaseSettings):
    """Centralized application settings.

    Booleans are declared as `str` and normalized via validators so that
    common truthy representations (e.g. "True", "1") are handled
    consistently, avoiding the classic `bool(os.getenv(...))` bug where
    any non-empty string evaluates truthy.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- General ---
    debug_raw: str = Field(default="false", alias="DEBUG")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    # --- CORS ---
    cors_origins_raw: str = Field(default="", alias="CORS_ORIGINS")

    # --- External Invoice Publication Web-API (NTA) ---
    invoice_app_id: str = Field(default="", alias="INVOICE_APP_ID")
    invoice_api_url: str = Field(default="", alias="INVOICE_API_URL")
    invoice_api_timeout_seconds: float = Field(default=10.0, alias="INVOICE_API_TIMEOUT_SECONDS")
    invoice_api_max_retries: int = Field(default=2, alias="INVOICE_API_MAX_RETRIES")

    # --- Auth (Microsoft Entra ID) ---
    auth_disabled_raw: str = Field(default="true", alias="AUTH_DISABLED")
    azure_tenant_id: str = Field(default="", alias="AZURE_TENANT_ID")
    azure_api_audience: str = Field(default="", alias="AZURE_API_AUDIENCE")
    # ISSUER / JWKS_URI は既定でテナント ID から導出する。明示指定があればそれを優先。
    issuer_override: str = Field(default="", alias="ISSUER")
    jwks_uri_override: str = Field(default="", alias="JWKS_URI")
    required_app_role: str = Field(default="", alias="REQUIRED_APP_ROLE")
    jwks_cache_ttl_seconds: int = Field(default=3600, alias="JWKS_CACHE_TTL_SECONDS")

    @property
    def debug(self) -> bool:
        return _str_to_bool(self.debug_raw)

    @property
    def auth_disabled(self) -> bool:
        return _str_to_bool(self.auth_disabled_raw)

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def azure_jwks_uri(self) -> str:
        """Entra JWKS endpoint (override wins, else derived from tenant)."""
        if self.jwks_uri_override:
            return self.jwks_uri_override
        return f"https://login.microsoftonline.com/" f"{self.azure_tenant_id}/discovery/v2.0/keys"

    @property
    def azure_issuer(self) -> str:
        """Expected `iss` claim (override wins, else derived from tenant)."""
        if self.issuer_override:
            return self.issuer_override
        return f"https://login.microsoftonline.com/{self.azure_tenant_id}/v2.0"

    @property
    def allowed_audiences(self) -> tuple[str, ...]:
        """Accepted `aud` values: both `api://<appId>` and bare `<appId>`."""
        audience = self.azure_api_audience.strip()
        if not audience:
            return ()
        prefix = "api://"
        if audience.startswith(prefix):
            return (audience, audience[len(prefix) :])
        return (audience, f"{prefix}{audience}")


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton per process)."""
    return Settings()
