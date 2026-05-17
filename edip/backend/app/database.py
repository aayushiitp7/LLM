"""
Database Configuration — MongoDB with Motor and Beanie

Handles connection lifecycle and model initialization.
"""

from __future__ import annotations

import structlog
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import AsyncGenerator

from app.config import settings
# Import all Beanie Document models here so they can be registered
from app.models.user import User, APIKey, UserSession
from app.models.document import Document, DocumentChunk
from app.models.audit import AuditLog, QueryRecord, AnalyticsSnapshot

logger = structlog.get_logger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None

db = MongoDB()

async def init_db() -> None:
    """Initialize MongoDB connection and Beanie ODM."""
    logger.info("db.connecting", url="[REDACTED]")
    try:
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            uuidRepresentation="standard"
        )
        database = db.client[settings.MONGODB_DATABASE_NAME]
        
        await init_beanie(
            database=database,
            document_models=[
                User,
                APIKey,
                UserSession,
                Document,
                DocumentChunk,
                AuditLog,
                QueryRecord,
                AnalyticsSnapshot
            ],
        )
        logger.info("db.connected", database=settings.MONGODB_DATABASE_NAME)
    except Exception as e:
        logger.error("db.connection_failed", error=str(e))
        raise

async def close_db() -> None:
    """Close MongoDB connection gracefully."""
    if db.client:
        db.client.close()
        logger.info("db.disconnected")

async def check_db_connection() -> bool:
    """Check if the database connection is alive."""
    if db.client is None:
        return False
    try:
        await db.client.admin.command('ping')
        return True
    except Exception:
        return False

# In Beanie, you don't need a session dependency like get_db for every route.
# However, to keep existing route signatures from breaking immediately,
# we can provide a dummy get_db that returns None or the database object.
async def get_db() -> AsyncGenerator[None, None]:
    """Dependency injection placeholder."""
    yield None
