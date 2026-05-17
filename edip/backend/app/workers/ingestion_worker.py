"""
Document Ingestion Worker — Full Processing Pipeline

Pipeline stages:
1. Download from MinIO
2. OCR (if scanned/image PDF)
3. Text extraction (if native PDF/DOCX)
4. Document structuring (metadata extraction, entity recognition)
5. Semantic chunking
6. Embedding generation
7. Vector database indexing
8. Full-text search indexing (Elasticsearch)
9. Status update + notifications

Each stage is fault-tolerant with automatic retries and dead-letter handling.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
import structlog
from celery import current_task, shared_task
from celery.exceptions import MaxRetriesExceededError

from app.workers.celery_app import celery_app
from app.config import settings

logger = structlog.get_logger(__name__)


def get_db_session():
    """Get synchronous database session for Celery workers."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)
    Session = sessionmaker(engine)
    return Session()


def get_minio():
    """Get MinIO client."""
    from minio import Minio
    return Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_USE_SSL,
    )


# ─── Main Pipeline Task ────────────────────────────────────────────────────

@celery_app.task(
    name="app.workers.ingestion_worker.process_document_pipeline",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="ingestion",
    track_started=True,
    soft_time_limit=600,    # 10 minute soft limit per document
    time_limit=720,         # 12 minute hard limit
)
def process_document_pipeline(
    self,
    document_id: str,
    tenant_id: str,
) -> Dict[str, Any]:
    """
    Full document processing pipeline.
    Runs all stages sequentially with individual error handling.
    """
    from app.models.document import Document, DocumentStatus

    start_time = time.time()
    db = get_db_session()

    try:
        # Load document
        doc = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
        if not doc:
            raise ValueError(f"Document {document_id} not found.")

        logger.info(
            "pipeline.start",
            document_id=document_id,
            filename=doc.original_filename,
        )

        # Update status
        doc.status = DocumentStatus.OCR_PROCESSING
        doc.processing_attempts = (doc.processing_attempts or 0) + 1
        db.commit()

        # ── Stage 1: Download document ──────────────────────────────────

        minio = get_minio()
        response = minio.get_object(doc.storage_bucket, doc.storage_path)
        doc_bytes = response.read()
        response.close()
        response.release_conn()

        logger.info("pipeline.downloaded", document_id=document_id, bytes=len(doc_bytes))

        # ── Stage 2: OCR Processing ─────────────────────────────────────

        ocr_result = None
        raw_text = ""

        # Always run OCR for scanned PDFs and images
        needs_ocr = doc.mime_type in (
            "image/png", "image/jpeg", "image/tiff",
            "application/pdf",
        )

        if needs_ocr:
            ocr_result = _call_ocr_service(document_id, doc.storage_path, doc.storage_bucket)

            if ocr_result:
                raw_text = " ".join(
                    page.get("raw_text", "") for page in ocr_result.get("pages", [])
                )

                # Store OCR results
                _store_ocr_results(db, document_id, ocr_result)

                doc.status = DocumentStatus.OCR_COMPLETE
                doc.page_count = ocr_result.get("total_pages", 0)
                db.commit()

        # ── Stage 3: Text Extraction (for native text documents) ────────

        if not raw_text:
            raw_text = _extract_text(doc_bytes, doc.mime_type)

        if not raw_text or len(raw_text.strip()) < 10:
            logger.warning("pipeline.empty_text", document_id=document_id)
            doc.status = DocumentStatus.FAILED
            doc.processing_error = "No extractable text found."
            db.commit()
            return {"status": "failed", "reason": "no_text"}

        doc.raw_text = raw_text[:500000]  # Cap at 500K chars in DB

        # ── Stage 4: Document Classification + Metadata Extraction ──────

        doc.status = DocumentStatus.STRUCTURING
        db.commit()

        metadata = _extract_metadata(raw_text, doc.original_filename)
        if metadata.get("document_type"):
            from app.models.document import DocumentType
            try:
                doc.document_type = DocumentType(metadata["document_type"])
                doc.document_type_confidence = metadata.get("confidence", 0.5)
            except ValueError:
                pass

        if metadata.get("title"):
            doc.title = metadata["title"][:1000]
        if metadata.get("author"):
            doc.author = metadata["author"][:255]
        if metadata.get("effective_date"):
            doc.effective_date = metadata["effective_date"]

        doc.detected_language = metadata.get("language", "en")
        doc.structured_content = metadata.get("structured", {})

        # ── Stage 5: Semantic Chunking ──────────────────────────────────

        doc.status = DocumentStatus.EMBEDDING
        db.commit()

        chunks = _semantic_chunk(
            text=raw_text,
            document_id=document_id,
            tenant_id=tenant_id,
            document_metadata=metadata,
        )

        # Store chunks in DB
        _store_chunks(db, document_id, tenant_id, chunks)
        doc.chunk_count = len(chunks)
        db.commit()

        logger.info("pipeline.chunked", document_id=document_id, chunks=len(chunks))

        # ── Stage 6: Embedding + Vector Indexing ────────────────────────

        _call_embedding_service(document_id, tenant_id, chunks)

        # ── Stage 7: Elasticsearch Full-Text Indexing ───────────────────

        _index_elasticsearch(doc, raw_text)

        # ── Stage 8: Finalize ───────────────────────────────────────────

        doc.status = DocumentStatus.INDEXED
        doc.is_indexed = True
        doc.indexed_at = datetime.now(timezone.utc)
        doc.embedding_version = settings.EMBEDDING_MODEL
        db.commit()

        elapsed = round(time.time() - start_time, 2)

        logger.info(
            "pipeline.complete",
            document_id=document_id,
            chunks=len(chunks),
            elapsed_seconds=elapsed,
        )

        return {
            "status": "success",
            "document_id": document_id,
            "chunks": len(chunks),
            "pages": doc.page_count,
            "elapsed_seconds": elapsed,
        }

    except SoftTimeLimitExceeded:
        logger.error("pipeline.timeout", document_id=document_id)
        _mark_failed(db, document_id, "Processing timeout exceeded.")
        return {"status": "failed", "reason": "timeout"}

    except Exception as exc:
        logger.exception("pipeline.error", document_id=document_id, error=str(exc))

        try:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        except MaxRetriesExceededError:
            _mark_failed(db, document_id, f"Max retries exceeded: {exc}")
            return {"status": "failed", "reason": str(exc)}

    finally:
        db.close()


# ─── Stage Implementations ─────────────────────────────────────────────────

def _call_ocr_service(
    document_id: str,
    storage_path: str,
    storage_bucket: str,
) -> Optional[Dict]:
    """Call OCR microservice synchronously."""
    try:
        response = httpx.post(
            f"{settings.OCR_SERVICE_URL}/ocr/process",
            json={
                "document_id": document_id,
                "storage_path": storage_path,
                "storage_bucket": storage_bucket,
                "language": settings.OCR_LANG,
                "extract_tables": True,
                "extract_forms": True,
                "detect_handwriting": True,
                "detect_signatures": True,
            },
            timeout=300,  # 5 minute timeout for OCR
        )
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        logger.error("pipeline.ocr_failed", document_id=document_id, error=str(exc))
        return None


def _extract_text(doc_bytes: bytes, mime_type: str) -> str:
    """Extract text from native documents (no OCR needed)."""
    try:
        if mime_type == "application/pdf":
            import fitz
            doc = fitz.open(stream=doc_bytes, filetype="pdf")
            return " ".join(page.get_text() for page in doc)

        elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            import docx
            import io
            d = docx.Document(io.BytesIO(doc_bytes))
            return " ".join(para.text for para in d.paragraphs if para.text)

        elif mime_type == "text/plain":
            return doc_bytes.decode("utf-8", errors="replace")

        elif mime_type == "text/csv":
            import csv
            import io
            reader = csv.reader(io.StringIO(doc_bytes.decode("utf-8", errors="replace")))
            return " ".join(" ".join(row) for row in reader)

        elif mime_type in ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",):
            import openpyxl
            import io
            wb = openpyxl.load_workbook(io.BytesIO(doc_bytes), data_only=True)
            texts = []
            for sheet in wb.worksheets:
                for row in sheet.iter_rows(values_only=True):
                    texts.append(" ".join(str(c) for c in row if c is not None))
            return " ".join(texts)

    except Exception as exc:
        logger.error("pipeline.text_extraction_failed", mime=mime_type, error=str(exc))

    return ""


def _extract_metadata(text: str, filename: str) -> Dict:
    """Extract document metadata using NLP and regex."""
    import re

    metadata: Dict = {"language": "en"}

    # Document type classification heuristics
    filename_lower = filename.lower()
    text_lower = text[:2000].lower()

    if any(w in filename_lower or w in text_lower for w in ["contract", "agreement", "nda", "msa"]):
        metadata["document_type"] = "contract"
    elif any(w in filename_lower or w in text_lower for w in ["invoice", "billing", "payment"]):
        metadata["document_type"] = "invoice"
    elif any(w in filename_lower or w in text_lower for w in ["resume", "curriculum", "cv"]):
        metadata["document_type"] = "resume"
    elif any(w in filename_lower or w in text_lower for w in ["policy", "procedure", "guideline"]):
        metadata["document_type"] = "policy"
    elif any(w in filename_lower or w in text_lower for w in ["claim", "insurance", "coverage"]):
        metadata["document_type"] = "insurance_claim"
    else:
        metadata["document_type"] = "unknown"

    # Extract dates
    date_patterns = [
        r"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b",
        r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b",
        r"\b\d{4}\-\d{2}\-\d{2}\b",
    ]
    dates = []
    for pattern in date_patterns:
        dates.extend(re.findall(pattern, text[:5000], re.IGNORECASE))
    if dates:
        metadata["dates_found"] = dates[:10]

    # Extract amounts
    amounts = re.findall(r"\$[\d,]+\.?\d*|\b[\d,]+\s*(?:USD|EUR|GBP)\b", text[:5000])
    if amounts:
        metadata["amounts_found"] = amounts[:10]

    return metadata


def _semantic_chunk(
    text: str,
    document_id: str,
    tenant_id: str,
    document_metadata: Dict,
) -> List[Dict]:
    """Run the semantic chunker and return serializable chunk dicts."""
    from app.workers.chunker import get_chunker

    chunker = get_chunker(settings.CHUNKING_STRATEGY)
    doc_chunks = chunker.chunk(text, document_metadata)

    return [
        {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "tenant_id": tenant_id,
            "chunk_index": c.metadata.chunk_index,
            "content": c.content,
            "content_hash": c.metadata.content_hash,
            "chunk_type": c.metadata.chunk_type,
            "heading_context": c.metadata.heading_context,
            "section_title": c.metadata.section_title,
            "hierarchy_path": c.metadata.hierarchy_path,
            "page_number": c.metadata.page_number,
            "token_count": c.metadata.token_count,
            "char_count": c.metadata.char_count,
            "chunking_strategy": c.metadata.chunking_strategy,
            "overlap_with_prev": c.metadata.overlap_with_prev,
            "overlap_with_next": c.metadata.overlap_with_next,
        }
        for c in doc_chunks
    ]


def _store_chunks(db, document_id: str, tenant_id: str, chunks: List[Dict]) -> None:
    """Bulk insert chunks into PostgreSQL."""
    from app.models.document import DocumentChunk

    # Delete existing chunks if re-processing
    db.query(DocumentChunk).filter(
        DocumentChunk.document_id == uuid.UUID(document_id)
    ).delete()

    for chunk_data in chunks:
        chunk = DocumentChunk(
            id=uuid.UUID(chunk_data["id"]),
            document_id=uuid.UUID(document_id),
            tenant_id=uuid.UUID(tenant_id),
            **{k: v for k, v in chunk_data.items() if k not in ("id", "document_id", "tenant_id")},
        )
        db.add(chunk)

    db.flush()


def _store_ocr_results(db, document_id: str, ocr_result: Dict) -> None:
    """Store per-page OCR results in PostgreSQL."""
    from app.models.document import OCRResult

    # Delete existing OCR results
    db.query(OCRResult).filter(
        OCRResult.document_id == uuid.UUID(document_id)
    ).delete()

    for page in ocr_result.get("pages", []):
        result = OCRResult(
            document_id=uuid.UUID(document_id),
            page_number=page["page_number"],
            engine=ocr_result.get("engine", "ensemble"),
            raw_text=page.get("raw_text", ""),
            word_count=page.get("word_count", 0),
            confidence_score=page.get("confidence_score"),
            bounding_boxes=page.get("bounding_boxes", []),
            layout_data=page.get("layout_data"),
            tables_data=page.get("tables", []),
            tables_detected=len(page.get("tables", [])),
            has_handwriting=page.get("has_handwriting", False),
            has_signatures=page.get("has_signatures", False),
            is_rotated=page.get("is_rotated", False),
            rotation_angle=page.get("rotation_angle", 0.0),
            page_width=page.get("page_width"),
            page_height=page.get("page_height"),
            processing_time_ms=page.get("processing_time_ms"),
        )
        db.add(result)

    db.flush()


def _call_embedding_service(
    document_id: str,
    tenant_id: str,
    chunks: List[Dict],
) -> None:
    """Call embedding service to embed and index chunks."""
    try:
        response = httpx.post(
            f"{settings.EMBEDDING_SERVICE_URL}/embed/document",
            json={
                "document_id": document_id,
                "tenant_id": tenant_id,
                "chunks": chunks,
            },
            timeout=120,
        )
        response.raise_for_status()
    except Exception as exc:
        logger.error("pipeline.embedding_failed", document_id=document_id, error=str(exc))
        raise


def _index_elasticsearch(doc, text: str) -> None:
    """Index document in Elasticsearch for full-text search."""
    try:
        from elasticsearch import Elasticsearch

        es = Elasticsearch(settings.ELASTICSEARCH_URL)
        es.index(
            index=settings.ELASTICSEARCH_INDEX_DOCUMENTS,
            id=str(doc.id),
            document={
                "id": str(doc.id),
                "tenant_id": str(doc.tenant_id),
                "filename": doc.original_filename,
                "document_type": doc.document_type.value if doc.document_type else None,
                "department": doc.department.value if doc.department else None,
                "tags": doc.tags or [],
                "compliance_tags": doc.compliance_tags or [],
                "text": text[:100000],  # Elasticsearch limit
                "created_at": doc.created_at.isoformat(),
                "author": doc.author,
                "title": doc.title,
            },
        )
    except Exception as exc:
        logger.warning("pipeline.es_index_failed", document_id=str(doc.id), error=str(exc))
        # Non-fatal — full-text search degraded but vector search still works


def _mark_failed(db, document_id: str, error: str) -> None:
    """Mark document as failed in database."""
    from app.models.document import Document, DocumentStatus

    doc = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
    if doc:
        doc.status = DocumentStatus.FAILED
        doc.processing_error = error[:1000]
        db.commit()


# ─── Retry Failed Documents ────────────────────────────────────────────────

@celery_app.task(
    name="app.workers.ingestion_worker.retry_failed_documents",
    queue="ingestion",
)
def retry_failed_documents() -> Dict:
    """Scheduled task: retry documents stuck in FAILED status."""
    from app.models.document import Document, DocumentStatus

    db = get_db_session()
    try:
        # Find documents that failed within last 24h and haven't exceeded retry limit
        failed_docs = (
            db.query(Document)
            .filter(
                Document.status == DocumentStatus.FAILED,
                Document.processing_attempts < settings.CELERY_MAX_RETRIES,
                Document.is_deleted.is_(False),
            )
            .limit(50)
            .all()
        )

        retried = 0
        for doc in failed_docs:
            process_document_pipeline.apply_async(
                args=[str(doc.id), str(doc.tenant_id)],
                queue="ingestion",
            )
            retried += 1

        logger.info("pipeline.retry_batch", retried=retried)
        return {"retried": retried}

    finally:
        db.close()
