"""Pydantic v2 schemas for the invoice search endpoint."""

from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

# 13 digits, optionally prefixed with "T" (registration number format).
INVOICE_NUMBER_PATTERN = r"^T?\d{13}$"


class InvoiceSearchRequest(BaseModel):
    """Request body for POST /api/invoice-search."""

    model_config = ConfigDict(extra="forbid")

    invoice_numbers: list[str] = Field(..., min_length=1, max_length=10, alias="invoiceNum")

    @field_validator("invoice_numbers")
    @classmethod
    def validate_invoice_numbers(cls, value: list[str]) -> list[str]:
        for number in value:
            if not re.match(INVOICE_NUMBER_PATTERN, number):
                raise ValueError(
                    f"Invalid invoice number format: {number!r}. "
                    "Expected 13 digits, optionally prefixed with 'T'."
                )
        return value


class InvoiceSearchResult(BaseModel):
    """A single matched record from the NTA publication Web-API."""

    model_config = ConfigDict(populate_by_name=True)

    invoice_number: str = Field(alias="invoiceNumber")
    name: str | None = Field(default=None, alias="name")
    address: str | None = Field(default=None, alias="address")
    # 屋号 (trade name). Not always published; null when unavailable.
    trade_name: str | None = Field(default=None, alias="tradeName")
    # 登録状況 (registration status: active/revoked etc.).
    # TODO: Confirm exact NTA Web-API field semantics for revocation status
    # (`process`/`kind`) and map to a stable enum once confirmed with PM.
    invoice_check: str | None = Field(default=None, alias="invoiceCheck")


class InvoiceSearchResponse(BaseModel):
    """Response body for POST /api/invoice-search."""

    model_config = ConfigDict(populate_by_name=True)

    results: list[InvoiceSearchResult]
