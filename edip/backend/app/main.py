"""
Enterprise Document Intelligence Platform — Simple Backend Entry
"""
import uuid
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, close_db
from app.api.v1 import (
    auth, documents, ingestion, chat, search, admin, analytics
)

logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI."""
    logger.info("edip.startup", version=settings.APP_VERSION)
    await init_db()
    logger.info("edip.database.ready")
    
    yield
    
    await close_db()
    logger.info("edip.shutdown.complete")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url=f"{settings.API_V1_PREFIX}/docs",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple Request Logger
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    logger.info(f"Request started: {request.method} {request.url.path}")
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    logger.info(f"Request finished: {response.status_code}")
    return response

# Include Routers
prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=prefix, tags=["Auth"])
app.include_router(documents.router, prefix=prefix, tags=["Documents"])
app.include_router(ingestion.router, prefix=prefix, tags=["Ingestion"])
app.include_router(chat.router, prefix=prefix, tags=["Chat"])
app.include_router(search.router, prefix=prefix, tags=["Search"])
app.include_router(analytics.router, prefix=prefix, tags=["Analytics"])
app.include_router(admin.router, prefix=prefix, tags=["Admin"])

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
