"""
Embedding Background Workers
"""

from app.workers.celery_app import celery_app

@celery_app.task
def reembed_document(document_id: str):
    pass
