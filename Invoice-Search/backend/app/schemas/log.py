"""Pydantic v2 schemas for the client-side log ingestion endpoint."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class LogLevel(str, Enum):
    INFO = "INFO"
    DEBUG = "DEBUG"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogRequest(BaseModel):
    """Request body for POST /api/logs."""

    model_config = ConfigDict(extra="forbid")

    message: str = Field(..., min_length=1, max_length=2000)
    level: LogLevel = LogLevel.INFO
    file_name: str = Field(..., alias="fileName")
