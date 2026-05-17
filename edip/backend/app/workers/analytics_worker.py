"""
Analytics Worker — Scheduled background aggregations

Tasks:
- Aggregate daily/hourly metrics
- Clean up expired sessions
- Generate scheduled reports
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Dict

import structlog
from sqlalchemy import text

from app.workers.celery_app import celery_app
from app.config import settings

logger = structlog.get_logger(__name__)


def get_db_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)
    Session = sessionmaker(engine)
    return Session()


@celery_app.task(name="app.workers.analytics_worker.aggregate_metrics", queue="analytics")
def aggregate_metrics() -> Dict[str, Any]:
    """Aggregate high-volume metrics into snapshot tables."""
    db = get_db_session()
    try:
        # Example: Materialized view refresh or manual aggregation query
        # In a real system, you might run a heavy GROUP BY query and insert into an AnalyticsSnapshot table
        db.execute(text("SELECT 1")) # Placeholder for actual aggregation
        db.commit()
        
        logger.info("analytics.aggregation_complete", timestamp=datetime.now(timezone.utc).isoformat())
        return {"status": "success"}
    except Exception as e:
        logger.error("analytics.aggregation_failed", error=str(e))
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="app.workers.analytics_worker.cleanup_expired_sessions", queue="analytics")
def cleanup_expired_sessions() -> Dict[str, Any]:
    """Remove expired sessions to save DB space."""
    from app.models.user import UserSession
    
    db = get_db_session()
    try:
        now = datetime.now(timezone.utc)
        deleted = db.query(UserSession).filter(UserSession.expires_at < now).delete()
        db.commit()
        
        logger.info("analytics.sessions_cleaned", deleted=deleted)
        return {"status": "success", "deleted_count": deleted}
    except Exception as e:
        logger.error("analytics.session_cleanup_failed", error=str(e))
        db.rollback()
        raise
    finally:
        db.close()
