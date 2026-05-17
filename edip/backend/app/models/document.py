"""
Beanie Models — Documents & Chunks
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any

from beanie import Document, Indexed
from pydantic import Field


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    OCR_PROCESSING = "ocr_processing"
    INDEXING = "indexing"
    EMBEDDING = "embedding"
    INDEXED = "indexed"
    FAILED = "failed"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Department(str, enum.Enum):
    LEGAL = "legal"
    FINANCE = "finance"
    HR = "hr"
    INSURANCE = "insurance"
    COMPLIANCE = "compliance"
    OPERATIONS = "operations"
    IT = "it"
    EXECUTIVE = "executive"
    EXTERNAL = "external"


class Document(Document):
    tenant_id: Indexed(uuid.UUID)
    original_filename: str
    title: Optional[str] = None
    document_type: Optional[str] = None
    department: Optional[Department] = None
    
    status: DocumentStatus = DocumentStatus.PENDING
    error_message: Optional[str] = None
    
    file_size_bytes: int
    mime_type: str
    sha256_hash: Indexed(str)
    storage_bucket: str
    storage_path: str
    
    page_count: Optional[int] = None
    chunk_count: Optional[int] = None
    
    risk_level: Optional[RiskLevel] = None
    risk_score: Optional[float] = None
    tags: List[str] = Field(default_factory=list)
    compliance_tags: List[str] = Field(default_factory=list)
    
    author: Optional[str] = None
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    detected_language: Optional[str] = None
    
    ai_summary: Optional[str] = None
    key_clauses: List[str] = Field(default_factory=list)
    identified_parties: List[str] = Field(default_factory=list)
    
    ocr_confidence: Optional[float] = None
    embedding_version: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    indexed_at: Optional[datetime] = None
    
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None

    class Settings:
        name = "documents"


class DocumentChunk(Document):
    document_id: Indexed(uuid.UUID)
    tenant_id: Indexed(uuid.UUID)
    chunk_index: int
    content: str
    
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    token_count: Optional[int] = None
    
    embedding_id: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "document_chunks"
