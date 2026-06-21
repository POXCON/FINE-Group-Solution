"""Unit tests for app.schemas.invoice."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.invoice import InvoiceSearchRequest, InvoiceSearchResult


@pytest.mark.parametrize(
    "number",
    ["1234567890123", "T1234567890123"],
)
def test_valid_invoice_numbers_accepted(number: str) -> None:
    request = InvoiceSearchRequest.model_validate({"invoiceNum": [number]})
    assert request.invoice_numbers == [number]


@pytest.mark.parametrize(
    "number",
    ["123", "T123", "12345678901234", "ABCDEFGHIJKLM", "T123456789012A", ""],
)
def test_invalid_invoice_numbers_rejected(number: str) -> None:
    with pytest.raises(ValidationError):
        InvoiceSearchRequest.model_validate({"invoiceNum": [number]})


def test_invoice_search_request_requires_at_least_one_number() -> None:
    with pytest.raises(ValidationError):
        InvoiceSearchRequest.model_validate({"invoiceNum": []})


def test_invoice_search_request_rejects_more_than_ten_numbers() -> None:
    numbers = [f"{i:013d}" for i in range(11)]
    with pytest.raises(ValidationError):
        InvoiceSearchRequest.model_validate({"invoiceNum": numbers})


def test_invoice_search_result_allows_null_optional_fields() -> None:
    result = InvoiceSearchResult.model_validate({"invoiceNumber": "T1234567890123"})
    assert result.name is None
    assert result.address is None
    assert result.trade_name is None
    assert result.invoice_check is None
