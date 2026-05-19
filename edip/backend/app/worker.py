"""
Celery Worker for Async Document Ingestion & Structuring
"""
import os
import uuid
import structlog
from celery import Celery
import cv2

from app.config import settings
import chromadb

logger = structlog.get_logger(__name__)

# Initialize Celery connected to Redis
celery_app = Celery(
    "edip_worker",
    broker=settings.REDIS_URI,
    backend=settings.REDIS_URI
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="process_document_task")
def process_document_task(file_path: str, filename: str):
    """
    Role 1: Ingestion & OCR Pipeline
    Role 2: Document Structuring & Metadata Extraction
    """
    logger.info(f"Starting async processing for {file_path}")
    
    try:
        # 1. OCR (PaddleOCR)
        from services.ocr_service.app.engines.paddleocr_engine import PaddleOCREngine
        engine = PaddleOCREngine(lang="en", use_gpu=False)
        
        image = cv2.imread(file_path)
        if image is None:
            logger.error(f"Failed to read image for OCR: {file_path}")
            return {"status": "error", "error": "Invalid image format"}

        result = engine.process(image)
        full_text = result.get("text", "")
        confidence = result.get("confidence", 0.0)
        
        # 2. Structuring & Chunking (Section-aware simulation)
        # In a full capstone, this would use spaCy or Regex. 
        # Here we do naive chunking by paragraphs for simplicity, 
        # but attach metadata as requested by Role 2.
        paragraphs = [p.strip() for p in full_text.split('\n\n') if p.strip()]
        if not paragraphs:
            paragraphs = [full_text]
            
        chunks = []
        for i, para in enumerate(paragraphs):
            # Naive metadata extraction
            section_title = "General"
            if len(para) < 100 and para.istitle():
                section_title = para
                
            chunks.append({
                "content": para,
                "metadata": {
                    "source": filename,
                    "confidence": confidence,
                    "chunk_index": i,
                    "section_title": section_title,
                    "document_type": "scanned_doc" # Role 2: Schema extraction
                }
            })
            
        # 3. Insert into ChromaDB (Vector Knowledge Index)
        chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
        collection = chroma_client.get_or_create_collection(name=settings.CHROMA_COLLECTION)
        
        for c in chunks:
            collection.add(
                documents=[c["content"]],
                metadatas=[c["metadata"]],
                ids=[str(uuid.uuid4())]
            )
            
        logger.info(f"Successfully processed {filename}. Extracted {len(chunks)} structured chunks.")
        return {"status": "success", "chunks_extracted": len(chunks)}
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        return {"status": "error", "error": str(e)}
