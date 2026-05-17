"""
Embedding Worker — Handles background embedding and vector indexing tasks.

Tasks:
- Re-embed chunks when model is updated
- Rebuild BM25 sparse indexes periodically
- Index new chunks into Chroma/FAISS
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

import httpx
import structlog
from celery import shared_task
from sqlalchemy import select

from app.workers.celery_app import celery_app
from app.config import settings

logger = structlog.get_logger(__name__)


def get_db_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)
    Session = sessionmaker(engine)
    return Session()


@celery_app.task(name="app.workers.embedding_worker.rebuild_bm25_indexes", queue="embedding")
def rebuild_bm25_indexes() -> Dict[str, Any]:
    """Scheduled task to rebuild BM25 sparse indexes for all active tenants."""
    from app.models.document import Document
    
    db = get_db_session()
    try:
        # Get all distinct tenant IDs with active documents
        stmt = select(Document.tenant_id).where(Document.is_deleted.is_(False)).distinct()
        tenant_ids = [row[0] for row in db.execute(stmt)]
        
        results = []
        for tenant_id in tenant_ids:
            try:
                response = httpx.post(
                    f"{settings.RETRIEVAL_SERVICE_URL}/admin/rebuild-bm25",
                    json={"tenant_id": str(tenant_id)},
                    timeout=300
                )
                response.raise_for_status()
                results.append({"tenant_id": str(tenant_id), "status": "success"})
            except Exception as e:
                logger.error("bm25.rebuild_failed", tenant_id=str(tenant_id), error=str(e))
                results.append({"tenant_id": str(tenant_id), "status": "failed", "error": str(e)})
                
        return {"total_tenants": len(tenant_ids), "results": results}
    finally:
        db.close()


@celery_app.task(name="app.workers.embedding_worker.reembed_document", queue="embedding")
def reembed_document(document_id: str, tenant_id: str, model_name: str) -> Dict[str, Any]:
    """Force re-embedding of a specific document (e.g., model migration)."""
    from app.models.document import DocumentChunk
    
    db = get_db_session()
    try:
        # Fetch chunks
        stmt = select(DocumentChunk).where(DocumentChunk.document_id == uuid.UUID(document_id))
        chunks = db.execute(stmt).scalars().all()
        
        if not chunks:
            return {"status": "skipped", "reason": "no_chunks"}
            
        chunk_dicts = [
            {
                "id": str(c.id),
                "document_id": document_id,
                "tenant_id": tenant_id,
                "content": c.content,
                "chunk_index": c.chunk_index
            }
            for c in chunks
        ]
        
        # Call embedding service
        response = httpx.post(
            f"{settings.EMBEDDING_SERVICE_URL}/embed/document",
            json={
                "document_id": document_id,
                "tenant_id": tenant_id,
                "chunks": chunk_dicts,
                "force_model": model_name
            },
            timeout=300
        )
        response.raise_for_status()
        
        return {"status": "success", "chunks_processed": len(chunk_dicts)}
    except Exception as e:
        logger.error("embedding.reembed_failed", document_id=document_id, error=str(e))
        raise
    finally:
        db.close()
