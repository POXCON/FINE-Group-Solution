"""Unit tests for app.services.invoice_search (httpx mocked via respx)."""

from __future__ import annotations

import httpx
import pytest
import respx

from app.core.config import Settings
from app.services.invoice_search import InvoiceApiError, search_invoices


@pytest.fixture
def settings(test_settings: Settings) -> Settings:
    return test_settings


@respx.mock
async def test_search_invoices_maps_announcement_fields(settings: Settings) -> None:
    respx.get(settings.invoice_api_url).mock(
        return_value=httpx.Response(
            200,
            json={
                "announcement": [
                    {
                        "registratedNumber": "T1234567890123",
                        "name": "テスト株式会社",
                        "address": "東京都千代田区",
                        "tradeName": "テストブランド",
                        "process": "01",
                    }
                ]
            },
        )
    )

    results = await search_invoices(["T1234567890123"], settings)

    assert len(results) == 1
    assert results[0].invoice_number == "T1234567890123"
    assert results[0].name == "テスト株式会社"
    assert results[0].address == "東京都千代田区"
    assert results[0].trade_name == "テストブランド"
    assert results[0].invoice_check == "01"


@respx.mock
async def test_search_invoices_returns_empty_list_when_no_match(settings: Settings) -> None:
    respx.get(settings.invoice_api_url).mock(
        return_value=httpx.Response(200, json={"announcement": []})
    )

    results = await search_invoices(["T1234567890123"], settings)

    assert results == []


@respx.mock
async def test_search_invoices_retries_then_succeeds(settings: Settings) -> None:
    route = respx.get(settings.invoice_api_url)
    route.side_effect = [
        httpx.Response(500),
        httpx.Response(200, json={"announcement": []}),
    ]

    results = await search_invoices(["T1234567890123"], settings)

    assert results == []
    assert route.call_count == 2


@respx.mock
async def test_search_invoices_raises_after_exhausting_retries(settings: Settings) -> None:
    respx.get(settings.invoice_api_url).mock(return_value=httpx.Response(500))

    with pytest.raises(InvoiceApiError):
        await search_invoices(["T1234567890123"], settings)


async def test_search_invoices_raises_when_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("INVOICE_APP_ID", "")
    monkeypatch.setenv("INVOICE_API_URL", "")
    settings = Settings()

    with pytest.raises(InvoiceApiError):
        await search_invoices(["T1234567890123"], settings)


@respx.mock
async def test_search_invoices_uses_params_not_string_concat(settings: Settings) -> None:
    route = respx.get(settings.invoice_api_url).mock(
        return_value=httpx.Response(200, json={"announcement": []})
    )

    await search_invoices(["T1234567890123", "T9876543210987"], settings)

    request = route.calls.last.request
    assert request.url.params["number"] == "T1234567890123,T9876543210987"
    assert request.url.params["id"] == settings.invoice_app_id
    assert request.url.params["type"] == "21"
    assert request.url.params["history"] == "0"
