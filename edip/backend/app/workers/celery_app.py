"""
Celery Task Definitions
"""

from celery import Celery

celery_app = Celery("edip_tasks")

# Stub out celery config for now to prevent import errors with SQLAlchemy
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
