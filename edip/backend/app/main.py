"""
Enterprise Document Intelligence Platform — FastAPI Application Entry Point

Production-grade FastAPI application with:
- Async SQLAlchemy
- JWT + OAuth2 authentication
- RBAC middleware
- Structured logging (structlog)
- OpenTelemetry distributed tracing
- Rate limiting
- Security headers
- WebSocket support for real-time updates
- Prometheus metrics
- OpenAPI / Swagger documentation
"""

from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1 import (
    admin,
    analytics,
    auth,
    chat,
    documents,
    evaluation,
    ingestion,
    search,
)
from app.config import settings
from app.core.exceptions import EDIPException
from app.database import close_db, init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security import SecurityHeadersMiddleware

logger = structlog.get_logger(__name__)


# ─── OpenTelemetry Setup ────────────────────────────────────────────────────

def configure_telemetry() -> None:
    """Configure OpenTelemetry distributed tracing."""
    resource = Resource.create(
        {
            "service.name": settings.OTEL_SERVICE_NAME,
            "service.version": settings.APP_VERSION,
            "deployment.environment": settings.APP_ENV,
        }
    )
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)


# ─── Application Lifespan ───────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifecycle."""
    logger.info(
        "edip.startup",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
    )

    # Initialize database connection pool
    await init_db()
    logger.info("edip.database.ready")

    # Auto-seed Kaggle data if empty (SKIP on Vercel to prevent 504 timeouts)
    import os
    if not os.environ.get("VERCEL"):
        try:
            from app.models.document import Document
            doc_count = await Document.find().count()
            if doc_count == 0:
                logger.info("edip.database.seeding", msg="Database is empty. Seeding Kaggle/HuggingFace dataset...")
                import sys
                sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
                try:
                    from scripts.seed_real_data import main as seed_main
                    await seed_main()
                    logger.info("edip.database.seeded")
                except Exception as e:
                    logger.error("edip.database.seed_failed", error=str(e))
        except Exception as e:
            logger.error("edip.database.seed_check_failed", error=str(e))
    else:
        logger.info("edip.database.seeding_skipped", msg="Running on Vercel Serverless. Auto-seeding disabled to prevent timeout.")

    # Configure telemetry
    if settings.APP_ENV != "test":
        configure_telemetry()
        logger.info("edip.telemetry.ready")

    yield  # Application is now running

    # Graceful shutdown
    await close_db()
    logger.info("edip.shutdown.complete")


# ─── Application Factory ────────────────────────────────────────────────────

def create_application() -> FastAPI:
    """Factory function for the FastAPI application."""

    app = FastAPI(
        title=settings.APP_NAME,
        description="""
## Enterprise Document Intelligence Platform API

Production-grade API for enterprise document processing, AI-powered search,
retrieval-augmented generation, compliance analysis, and document analytics.

### Key Capabilities
- **Document Ingestion**: Multi-format upload with OCR, metadata extraction
- **Semantic Search**: Hybrid dense + sparse retrieval with reranking
- **AI Chat**: RAG-powered Q&A with source citations and confidence scores
- **Analytics**: Real-time document and usage analytics dashboards
- **Security**: RBAC, JWT, audit trails, PII masking, GDPR compliance

### Authentication
All endpoints require a valid JWT Bearer token (except `/auth/login` and `/health`).
Obtain a token via `POST /api/v1/auth/login`.
        """,
        version=settings.APP_VERSION,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        lifespan=lifespan,
        contact={
            "name": "EDIP Engineering Team",
            "email": "engineering@edip.internal",
        },
        license_info={
            "name": "Proprietary Enterprise License",
        },
    )

    # ── Middleware Stack (order matters — outermost first) ──────────────────

    # Security headers (must be first)
    app.add_middleware(SecurityHeadersMiddleware)

    # Trusted hosts (prevent host header injection)
    if settings.APP_ENV == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS,
        )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    )

    # GZip compression for responses > 1KB
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    # Rate limiting
    app.add_middleware(RateLimitMiddleware)

    # ── Request ID + Logging Middleware ────────────────────────────────────

    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.perf_counter()

        # Bind request context to structured logger
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else "unknown",
        )

        logger.info("edip.request.start")

        response: Response = await call_next(request)

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = str(duration_ms)

        logger.info(
            "edip.request.complete",
            status_code=response.status_code,
            duration_ms=duration_ms,
        )

        return response

    # ── Global Exception Handlers ──────────────────────────────────────────

    @app.exception_handler(EDIPException)
    async def edip_exception_handler(request: Request, exc: EDIPException) -> JSONResponse:
        logger.warning(
            "edip.exception",
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "details": exc.details,
                    "request_id": structlog.contextvars.get_contextvars().get("request_id"),
                }
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("edip.unhandled_exception", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred. Please contact support.",
                    "request_id": structlog.contextvars.get_contextvars().get("request_id"),
                }
            },
        )

    # ── API Routers ────────────────────────────────────────────────────────

    prefix = settings.API_V1_PREFIX

    app.include_router(auth.router, prefix=prefix, tags=["Authentication"])
    app.include_router(documents.router, prefix=prefix, tags=["Documents"])
    app.include_router(ingestion.router, prefix=prefix, tags=["Ingestion"])
    app.include_router(chat.router, prefix=prefix, tags=["AI Chat & RAG"])
    app.include_router(search.router, prefix=prefix, tags=["Search"])
    app.include_router(analytics.router, prefix=prefix, tags=["Analytics"])
    app.include_router(admin.router, prefix=prefix, tags=["Administration"])
    app.include_router(evaluation.router, prefix=prefix, tags=["Evaluation"])

    # ── Health Checks ──────────────────────────────────────────────────────

    @app.get("/health", tags=["Health"], summary="Basic liveness check")
    async def health_check() -> dict:
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
        }

    @app.get("/health/ready", tags=["Health"], summary="Readiness check (DB + services)")
    async def readiness_check() -> dict:
        from app.database import check_db_connection

        db_ok = await check_db_connection()
        return {
            "status": "ready" if db_ok else "degraded",
            "checks": {
                "database": "ok" if db_ok else "error",
            },
        }

    # ── Prometheus Metrics ─────────────────────────────────────────────────
    if settings.APP_ENV != "test":
        Instrumentator(
            should_group_status_codes=False,
            excluded_handlers=["/health", "/health/ready", "/metrics"],
        ).instrument(app).expose(app, endpoint="/metrics")

    # ── OpenTelemetry FastAPI Instrumentation ─────────────────────────────
    if settings.APP_ENV != "test":
        FastAPIInstrumentor.instrument_app(app)

    return app


# ─── Application Instance ──────────────────────────────────────────────────

app = create_application()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        workers=1,  # Use 1 worker in dev; Gunicorn manages workers in prod
        reload=settings.APP_ENV == "development",
        log_level="info",
        access_log=True,
    )
