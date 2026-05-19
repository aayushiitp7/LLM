"""
Ingestion API — Async Celery Implementation
"""
import os
import uuid
import shutil
import structlog
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException

from app.core.security import get_current_user
from app.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

# Ensure upload dir exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

async def process_document_local(file_path: str, filename: str):
    """Fallback parser that uses PyMuPDF (fitz) to extract text directly and save to MongoDB."""
    try:
        from app.models.document import Document, DocumentChunk, DocumentStatus
        import fitz  # PyMuPDF
        import uuid
        
        logger.info(f"Fallback direct PDF parsing started for {filename}")
        
        # Open PDF
        doc_obj = fitz.open(file_path)
        full_text = ""
        for page in doc_obj:
            full_text += page.get_text()
            
        if not full_text.strip():
            logger.warning(f"No text extracted directly from {filename}. Scanned PDFs require PaddleOCR.")
            full_text = "Scanned document text placeholder. OCR is only supported in Docker stack."
            
        paragraphs = [p.strip() for p in full_text.split('\n\n') if p.strip()]
        if not paragraphs:
            paragraphs = [full_text]
            
        # Create chunks
        chunks = []
        for i, para in enumerate(paragraphs):
            chunks.append({
                "content": para,
                "metadata": {
                    "source": filename,
                    "confidence": 1.0,
                    "chunk_index": i,
                    "section_title": "General",
                    "document_type": "pdf"
                }
            })
            
        # Find or create the document Beanie record
        import os
        from app.models.document import Document as BeanieDoc
        db_doc = await BeanieDoc.find_one(BeanieDoc.original_filename == filename, BeanieDoc.is_deleted == False)
        if not db_doc:
            db_doc = BeanieDoc(
                tenant_id=uuid.UUID("local_tenant"),
                original_filename=filename,
                file_size_bytes=os.path.getsize(file_path),
                mime_type="application/pdf",
                sha256_hash=str(uuid.uuid4()),
                storage_bucket="local",
                storage_path=file_path
            )
            await db_doc.insert()
            
        db_doc.status = DocumentStatus.INDEXED
        db_doc.page_count = len(doc_obj)
        db_doc.chunk_count = len(chunks)
        await db_doc.save()
        
        # Save chunks to MongoDB
        for chunk in chunks:
            db_chunk = DocumentChunk(
                document_id=db_doc.id,
                tenant_id=db_doc.tenant_id,
                chunk_index=chunk["metadata"]["chunk_index"],
                content=chunk["content"],
                page_number=1,
                section_title=chunk["metadata"]["section_title"]
            )
            await db_chunk.insert()
            
        logger.info(f"Fallback processing success for {filename}: {len(chunks)} chunks saved to MongoDB.")
    except Exception as e:
        logger.error(f"Fallback processing failed: {e}")

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
        
    file_path = os.path.join(settings.UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Attempt Celery task queuing
    celery_queued = False
    task_id = None
    try:
        from app.worker import process_document_task
        task = process_document_task.delay(file_path, file.filename)
        task_id = task.id
        celery_queued = True
    except Exception as e:
        logger.warning(f"Failed to queue celery task, falling back to local background task: {e}")
        
    if not celery_queued:
        # Fall back to standard FastAPI background tasks
        background_tasks.add_task(process_document_local, file_path, file.filename)
        task_id = f"local_{uuid.uuid4()}"
    
    return {
        "message": "Document uploaded successfully and queued for processing",
        "filename": file.filename,
        "task_id": task_id,
        "status": "processing"
    }
