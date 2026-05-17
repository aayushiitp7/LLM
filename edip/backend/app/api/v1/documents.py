"""
Documents API — Document management (MongoDB)
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.models.document import Document, DocumentChunk, DocumentStatus, Department, RiskLevel
from app.schemas import DocumentListItem, DocumentDetail, DocumentUpdateRequest, PaginatedResponse

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("", response_model=PaginatedResponse)
async def list_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    department: Optional[str] = None,
    document_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user=Depends(get_current_user),
) -> PaginatedResponse:
    query = Document.find(Document.tenant_id == uuid.UUID(current_user.tenant_id), Document.is_deleted == False)

    if department:
        query = query.find(Document.department == department)
    if document_type:
        query = query.find(Document.document_type == document_type)
    if risk_level:
        query = query.find(Document.risk_level == risk_level)
    if status:
        query = query.find(Document.status == status)
    if search:
        query = query.find({"$or": [{"original_filename": {"$regex": search, "$options": "i"}}, {"title": {"$regex": search, "$options": "i"}}]})

    total = await query.count()
    documents = await query.sort("-created_at").skip((page - 1) * page_size).limit(page_size).to_list()

    items = [
        DocumentListItem(
            id=str(d.id), filename=d.original_filename, title=d.title,
            document_type=d.document_type, department=d.department.value if d.department else None,
            status=d.status.value, page_count=d.page_count, chunk_count=d.chunk_count,
            risk_level=d.risk_level.value if d.risk_level else None, risk_score=d.risk_score,
            tags=d.tags, compliance_tags=d.compliance_tags, file_size_bytes=d.file_size_bytes,
            created_at=d.created_at, indexed_at=d.indexed_at, uploaded_by=None
        ) for d in documents
    ]

    return PaginatedResponse(
        total=total, page=page, page_size=page_size,
        pages=(total + page_size - 1) // page_size, items=items
    )

@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(
    document_id: str,
    current_user=Depends(get_current_user),
) -> DocumentDetail:
    doc = await Document.find_one(Document.id == uuid.UUID(document_id), Document.tenant_id == uuid.UUID(current_user.tenant_id), Document.is_deleted == False)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentDetail(
        id=str(doc.id), filename=doc.original_filename, title=doc.title,
        document_type=doc.document_type, department=doc.department.value if doc.department else None,
        status=doc.status.value, page_count=doc.page_count, chunk_count=doc.chunk_count,
        risk_level=doc.risk_level.value if doc.risk_level else None, risk_score=doc.risk_score,
        tags=doc.tags, compliance_tags=doc.compliance_tags, file_size_bytes=doc.file_size_bytes,
        created_at=doc.created_at, indexed_at=doc.indexed_at, uploaded_by=None,
        author=doc.author, effective_date=doc.effective_date, expiry_date=doc.expiry_date,
        sha256_hash=doc.sha256_hash, mime_type=doc.mime_type, storage_path=doc.storage_path,
        language=doc.detected_language, ai_summary=doc.ai_summary, key_clauses=doc.key_clauses,
        identified_parties=doc.identified_parties, ocr_confidence=doc.ocr_confidence,
        embedding_model=doc.embedding_version
    )
