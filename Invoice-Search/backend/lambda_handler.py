"""AWS Lambda entrypoint.

Wraps the FastAPI (ASGI) application with Mangum so it can run behind
API Gateway (HTTP API) on AWS Lambda without a long-running server.
"""

from __future__ import annotations

from mangum import Mangum

from app.main import app

handler = Mangum(app)
