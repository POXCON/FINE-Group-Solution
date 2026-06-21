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

    # --- Auth (Cognito) ---
    auth_disabled_raw: str = Field(default="true", alias="AUTH_DISABLED")
    cognito_user_pool_id: str = Field(default="", alias="COGNITO_USER_POOL_ID")
    cognito_region: str = Field(default="ap-northeast-1", alias="COGNITO_REGION")
    cognito_app_client_id: str = Field(default="", alias="COGNITO_APP_CLIENT_ID")

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
    def cognito_jwks_url(self) -> str:
        return (
            f"https://cognito-idp.{self.cognito_region}.amazonaws.com/"
            f"{self.cognito_user_pool_id}/.well-known/jwks.json"
        )

    @property
    def cognito_issuer(self) -> str:
        return (
            f"https://cognito-idp.{self.cognito_region}.amazonaws.com/"
            f"{self.cognito_user_pool_id}"
        )


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton per process)."""
    return Settings()
