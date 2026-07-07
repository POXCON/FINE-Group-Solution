# syntax=docker/dockerfile:1
# Invoice-Search backend container image.
# Runs the FastAPI app directly under uvicorn (no Mangum / Lambda shim),
# suitable for Azure Container Apps.
FROM python:3.12-slim AS base

# Fail fast, no .pyc, unbuffered logs for container log streaming.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Application code.
COPY app ./app

# Run as a non-root user.
RUN useradd --create-home --uid 10001 appuser
USER appuser

EXPOSE 8000

# Container Apps sets/overrides via ingress target-port; keep 8000 as default.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
