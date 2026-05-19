"""
Ingestion API — Async Celery Implementation
"""
import os
import uuid
import shutil
import structlog
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.core.security import get_current_user
from app.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

# Ensure upload dir exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
        
    file_path = os.path.join(settings.UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Queue Celery background processing
    try:
        from app.worker import process_document_task
        task = process_document_task.delay(file_path, file.filename)
        task_id = task.id
    except Exception as e:
        logger.error(f"Failed to queue celery task: {e}")
        task_id = "failed_to_queue"
    
    return {
        "message": "Document uploaded successfully and queued for processing",
        "filename": file.filename,
        "task_id": task_id,
        "status": "processing"
    }
