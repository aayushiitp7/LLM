"""
OCR Worker — Background task for async OCR re-processing
"""

from __future__ import annotations

from typing import Dict, Any
import structlog
from app.workers.celery_app import celery_app

logger = structlog.get_logger(__name__)

@celery_app.task(name="app.workers.ocr_worker.reprocess_ocr", queue="ocr")
def reprocess_ocr(document_id: str) -> Dict[str, Any]:
    """Force re-run OCR on a document."""
    logger.info("ocr_worker.reprocess", document_id=document_id)
    return {"status": "success", "document_id": document_id}
