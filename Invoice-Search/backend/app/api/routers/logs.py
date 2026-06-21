"""Client-side log ingestion API route.

Forwards frontend operational/error events into the standard structured
logging pipeline (CloudWatch in production), replacing the legacy
opencensus/Application Insights integration.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.logging_config import get_logger
from app.schemas.log import LogLevel, LogRequest

logger = get_logger("frontend")

router = APIRouter(prefix="/api", tags=["logs"])

_LOG_METHODS = {
    LogLevel.DEBUG: lambda log, msg, extra: log.debug(msg, extra=extra),
    LogLevel.INFO: lambda log, msg, extra: log.info(msg, extra=extra),
    LogLevel.WARNING: lambda log, msg, extra: log.warning(msg, extra=extra),
    LogLevel.ERROR: lambda log, msg, extra: log.error(msg, extra=extra),
    LogLevel.CRITICAL: lambda log, msg, extra: log.critical(msg, extra=extra),
}


@router.post("/logs", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def post_log(
    request_body: LogRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> None:
    """Record a client-originated log event via structured logging."""
    extra = {
        "extra_fields": {
            "user_id": current_user.user_id,
            "file_name": request_body.file_name,
        }
    }
    _LOG_METHODS[request_body.level](logger, request_body.message, extra)
