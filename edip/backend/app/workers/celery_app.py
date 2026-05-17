"""
Celery Application — Task Queue Configuration

Manages:
- Ingestion pipeline tasks (OCR → Structure → Embed)
- Embedding and re-indexing tasks
- Analytics aggregation tasks
- Scheduled maintenance tasks
- Dead-letter queue handling
"""

from __future__ import annotations

import structlog
from celery import Celery
from celery.schedules import crontab
from celery.signals import task_failure, task_success, worker_ready

from app.config import settings

logger = structlog.get_logger(__name__)

# ─── Celery App ────────────────────────────────────────────────────────────

celery_app = Celery(
    "edip",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.ingestion_worker",
        "app.workers.ocr_worker",
        "app.workers.embedding_worker",
        "app.workers.analytics_worker",
    ],
)

# ─── Configuration ─────────────────────────────────────────────────────────

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Task settings
    task_track_started=True,
    task_acks_late=True,            # Only ack after completion (safer)
    worker_prefetch_multiplier=1,   # Fair distribution across workers
    task_reject_on_worker_lost=True,

    # Retry policy
    task_max_retries=settings.CELERY_MAX_RETRIES,
    task_default_retry_delay=settings.CELERY_RETRY_BACKOFF,

    # Result backend
    result_expires=86400,           # 24 hours

    # Queue routing
    task_routes={
        "app.workers.ingestion_worker.*": {"queue": "ingestion"},
        "app.workers.ocr_worker.*": {"queue": "ocr"},
        "app.workers.embedding_worker.*": {"queue": "embedding"},
        "app.workers.analytics_worker.*": {"queue": "analytics"},
    },

    # Dead-letter queue
    task_queues={},
    task_default_queue="default",

    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,

    # Beat schedule (periodic tasks)
    beat_schedule={
        # Rebuild BM25 index hourly
        "rebuild-bm25-indexes": {
            "task": "app.workers.embedding_worker.rebuild_bm25_indexes",
            "schedule": crontab(minute=0),  # Every hour
        },
        # Aggregate analytics every 15 minutes
        "aggregate-analytics": {
            "task": "app.workers.analytics_worker.aggregate_metrics",
            "schedule": crontab(minute="*/15"),
        },
        # Clean expired sessions daily
        "cleanup-sessions": {
            "task": "app.workers.analytics_worker.cleanup_expired_sessions",
            "schedule": crontab(hour=3, minute=0),  # 3 AM daily
        },
        # Re-index failed documents every 30 minutes
        "retry-failed-documents": {
            "task": "app.workers.ingestion_worker.retry_failed_documents",
            "schedule": crontab(minute="*/30"),
        },
    },
)


# ─── Signal Handlers ───────────────────────────────────────────────────────

@task_failure.connect
def on_task_failure(sender, task_id, exception, args, kwargs, traceback, einfo, **kw):
    logger.error(
        "celery.task_failed",
        task_name=sender.name,
        task_id=task_id,
        error=str(exception),
        args=args[:2],  # Truncate for logging
    )


@task_success.connect
def on_task_success(sender, result, **kw):
    logger.debug("celery.task_success", task_name=sender.name)


@worker_ready.connect
def on_worker_ready(sender, **kw):
    logger.info("celery.worker_ready", hostname=sender.hostname)


if __name__ == "__main__":
    celery_app.start()
