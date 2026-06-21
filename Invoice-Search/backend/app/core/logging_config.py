"""Structured JSON logging configuration (CloudWatch-friendly).

Logging is configured exactly once at module import time to avoid the
classic "duplicate handler" bug that arises when `logging.basicConfig`
or `addHandler` is called repeatedly (e.g. once per request).
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

_CONFIGURED = False


class JsonFormatter(logging.Formatter):
    """Format log records as single-line JSON for CloudWatch ingestion."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        extra_fields = getattr(record, "extra_fields", None)
        if isinstance(extra_fields, dict):
            payload.update(extra_fields)

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: int = logging.INFO) -> None:
    """Configure the root logger once with a JSON stream handler.

    Safe to call multiple times: subsequent calls are no-ops.
    """
    global _CONFIGURED
    if _CONFIGURED:
        return

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(JsonFormatter())
    root_logger.addHandler(handler)

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a module-level logger. Ensures logging is configured."""
    configure_logging()
    return logging.getLogger(name)
