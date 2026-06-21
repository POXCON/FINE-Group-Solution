"""Service layer: mediates calls to the NTA invoice publication Web-API.

National Tax Agency (国税庁) 適格請求書発行事業者公表システム Web-API.
Docs (request/response spec) are published by NTA; the response payload
for a `type=21` (number search) request contains an `announcement` array
with fields such as `registratedNumber`, `name`, `tradeName`, `address`.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.core.config import Settings
from app.core.logging_config import get_logger
from app.schemas.invoice import InvoiceSearchResult

logger = get_logger(__name__)

_JST = timezone(timedelta(hours=9), "JST")


class InvoiceApiError(Exception):
    """Raised when the upstream NTA Web-API call fails irrecoverably."""


def _today_jst() -> str:
    return datetime.now(_JST).strftime("%Y-%m-%d")


def _build_params(invoice_numbers: list[str], app_id: str) -> dict[str, str]:
    return {
        "id": app_id,
        "number": ",".join(invoice_numbers),
        "day": _today_jst(),
        "type": "21",
        "history": "0",
    }


def _map_announcement(item: dict[str, Any]) -> InvoiceSearchResult:
    return InvoiceSearchResult(
        invoiceNumber=item.get("registratedNumber", ""),
        name=item.get("name"),
        address=item.get("address"),
        tradeName=item.get("tradeName"),
        # TODO: Confirm authoritative NTA field for registration status
        # (active/revoked). Using `process` as a best-effort placeholder
        # until confirmed; null when unavailable.
        invoiceCheck=item.get("process"),
    )


async def search_invoices(
    invoice_numbers: list[str],
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> list[InvoiceSearchResult]:
    """Query the NTA publication Web-API for the given invoice numbers.

    Raises:
        InvoiceApiError: when configuration is missing or the upstream
            call fails after retries.
    """
    if not settings.invoice_api_url or not settings.invoice_app_id:
        logger.error("Invoice API is not configured")
        raise InvoiceApiError("Invoice API is not configured")

    params = _build_params(invoice_numbers, settings.invoice_app_id)

    owns_client = http_client is None
    client = http_client or httpx.AsyncClient(timeout=settings.invoice_api_timeout_seconds)

    try:
        data = await _request_with_retry(client, settings, params)
    finally:
        if owns_client:
            await client.aclose()

    announcements = data.get("announcement", [])
    return [_map_announcement(item) for item in announcements]


async def _request_with_retry(
    client: httpx.AsyncClient,
    settings: Settings,
    params: dict[str, str],
) -> dict[str, Any]:
    last_error: Exception | None = None
    attempts = max(1, settings.invoice_api_max_retries + 1)

    for attempt in range(attempts):
        try:
            response = await client.get(settings.invoice_api_url, params=params)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            last_error = exc
            logger.warning(
                "Invoice API request failed",
                extra={
                    "extra_fields": {
                        "attempt": attempt + 1,
                        "max_attempts": attempts,
                        "error": str(exc),
                    }
                },
            )

    logger.error(
        "Invoice API request failed after retries",
        extra={"extra_fields": {"error": str(last_error)}},
    )
    raise InvoiceApiError("Invoice API request failed") from last_error
