"""FastAPI application entrypoint for the Invoice-Search backend."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers import invoice, logs
from app.core.config import get_settings
from app.core.logging_config import configure_logging, get_logger

settings = get_settings()
configure_logging(level=logging.DEBUG if settings.debug else logging.INFO)
logger = get_logger(__name__)

app = FastAPI(title="Invoice-Search Backend", debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
)

app.include_router(invoice.router)
app.include_router(logs.router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok"}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    logger.warning(
        "Request validation failed",
        extra={"extra_fields": {"path": str(request.url.path), "errors": exc.errors()}},
    )
    return JSONResponse(
        content={"detail": "Invalid request."},
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled exception",
        extra={"extra_fields": {"path": str(request.url.path)}},
    )
    return JSONResponse(
        content={"detail": "Internal server error."},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
