"""
Analytics Background Workers
"""

from app.workers.celery_app import celery_app

@celery_app.task
def aggregate_metrics():
    pass
