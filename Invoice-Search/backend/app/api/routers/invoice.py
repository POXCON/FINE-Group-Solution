"""Invoice search API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import Settings, get_settings
from app.core.logging_config import get_logger
from app.schemas.invoice import InvoiceSearchRequest, InvoiceSearchResponse
from app.services.invoice_search import InvoiceApiError, search_invoices

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["invoice"])


@router.post("/invoice-search", response_model=InvoiceSearchResponse)
async def post_invoice_search(
    request_body: InvoiceSearchRequest,
    settings: Settings = Depends(get_settings),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> InvoiceSearchResponse:
    """Search invoice registration numbers via the NTA publication Web-API."""
    try:
        results = await search_invoices(request_body.invoice_numbers, settings)
    except InvoiceApiError:
        logger.exception(
            "Invoice search failed",
            extra={"extra_fields": {"user_id": current_user.user_id}},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve invoice information. Please try again later.",
        ) from None

    return InvoiceSearchResponse(results=results)
