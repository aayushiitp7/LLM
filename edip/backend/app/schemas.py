"""
Pydantic Schemas — Request/Response models for all API endpoints

Organized by domain:
- Auth schemas
- Document schemas
- Chat / RAG schemas
- Search schemas
- Analytics schemas
- Admin schemas
- Evaluation schemas
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Common ───────────────────────────────────────────────────────────────

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[Any]

class MessageResponse(BaseModel):
    message: str
    success: bool = True


# ─── Auth Schemas ─────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    mfa_token: Optional[str] = Field(default=None, min_length=6, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    mfa_required: bool = False
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class MFAVerifyRequest(BaseModel):
    mfa_token: str = Field(min_length=6, max_length=6)
    user_id: str

class MFASetupResponse(BaseModel):
    secret: str
    qr_code_url: str
    backup_codes: List[str]

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    department: Optional[str]
    tenant_id: str
    is_mfa_enabled: bool
    last_login_at: Optional[datetime]
    created_at: datetime

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=12)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v


# ─── Document Schemas ─────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    mime_type: str
    size_bytes: int
    sha256_hash: str
    is_duplicate: bool
    task_id: Optional[str] = None
    message: str

class DocumentStatus(BaseModel):
    document_id: str
    filename: str
    status: str
    progress_percent: Optional[int]
    processing_stage: Optional[str]
    page_count: Optional[int]
    chunk_count: Optional[int]
    error: Optional[str]
    created_at: datetime
    indexed_at: Optional[datetime]

class DocumentListItem(BaseModel):
    id: str
    filename: str
    title: Optional[str]
    document_type: Optional[str]
    department: Optional[str]
    status: str
    page_count: Optional[int]
    chunk_count: Optional[int]
    risk_level: Optional[str]
    risk_score: Optional[float]
    tags: List[str]
    compliance_tags: List[str]
    file_size_bytes: int
    created_at: datetime
    indexed_at: Optional[datetime]
    uploaded_by: Optional[str]

class DocumentDetail(DocumentListItem):
    author: Optional[str]
    effective_date: Optional[datetime]
    expiry_date: Optional[datetime]
    sha256_hash: str
    mime_type: str
    storage_path: str
    language: Optional[str]
    ai_summary: Optional[str]
    key_clauses: Optional[List[str]]
    identified_parties: Optional[List[str]]
    ocr_confidence: Optional[float]
    embedding_model: Optional[str]

class DocumentUpdateRequest(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    tags: Optional[List[str]] = None
    compliance_tags: Optional[List[str]] = None
    risk_level: Optional[str] = None
    notes: Optional[str] = None

class DocumentVersionItem(BaseModel):
    version: int
    sha256_hash: str
    size_bytes: int
    change_summary: Optional[str]
    created_at: datetime
    uploaded_by: Optional[str]


# ─── OCR / Processing Schemas ─────────────────────────────────────────────

class OCRResultSummary(BaseModel):
    document_id: str
    total_pages: int
    average_confidence: float
    has_tables: bool
    has_handwriting: bool
    engine_used: str
    processing_time_ms: int


# ─── Chat / RAG Schemas ───────────────────────────────────────────────────

class ChatQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    session_id: Optional[str] = None
    document_ids: Optional[List[str]] = None
    department_filter: Optional[str] = None
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    retrieval_strategy: str = Field(default="hybrid", pattern="^(hybrid|dense|sparse)$")
    top_k: int = Field(default=5, ge=1, le=20)
    stream: bool = True
    domain: str = Field(default="default", pattern="^(default|legal|finance|hr|insurance|compliance)$")

class CitationSource(BaseModel):
    chunk_id: str
    document_id: str
    document_title: Optional[str]
    filename: str
    page_number: Optional[int]
    section_title: Optional[str]
    heading_context: Optional[str]
    relevance_score: float
    content_snippet: str

class ChatQueryResponse(BaseModel):
    query_id: str
    session_id: str
    answer: str
    citations: List[CitationSource]
    confidence_score: float
    answer_refused: bool
    refusal_reason: Optional[str]
    retrieval_strategy: str
    chunks_retrieved: int
    chunks_used: int
    tokens_used: int
    total_latency_ms: int
    retrieval_latency_ms: int
    generation_latency_ms: int
    llm_provider: str
    llm_model: str
    estimated_cost_usd: float

class SessionMessage(BaseModel):
    id: str
    role: str  # user | assistant
    content: str
    citations: Optional[List[CitationSource]]
    confidence_score: Optional[float]
    created_at: datetime

class ChatSession(BaseModel):
    session_id: str
    title: Optional[str]
    message_count: int
    created_at: datetime
    last_message_at: Optional[datetime]

class FeedbackRequest(BaseModel):
    query_id: str
    feedback: str = Field(pattern="^(thumbs_up|thumbs_down)$")
    comment: Optional[str] = Field(default=None, max_length=500)


# ─── Search Schemas ───────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    document_types: Optional[List[str]] = None
    departments: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    risk_levels: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    top_k: int = Field(default=10, ge=1, le=50)
    strategy: str = Field(default="hybrid", pattern="^(hybrid|dense|sparse|fulltext)$")

class SearchResult(BaseModel):
    chunk_id: str
    document_id: str
    document_title: Optional[str]
    filename: str
    page_number: Optional[int]
    section_title: Optional[str]
    content: str
    score: float
    document_type: Optional[str]
    department: Optional[str]
    risk_level: Optional[str]
    matched_keywords: List[str]

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    strategy_used: str
    search_time_ms: int
    facets: Dict[str, Dict[str, int]]  # {department: {legal: 5, finance: 3}, ...}


# ─── Analytics Schemas ────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    total_documents: int
    total_documents_indexed: int
    total_documents_pending: int
    total_documents_failed: int
    total_queries_today: int
    total_queries_this_month: int
    avg_faithfulness_score: float
    avg_retrieval_latency_ms: float
    hallucination_rate: float
    active_users_today: int
    storage_used_gb: float
    total_tokens_used_this_month: int
    estimated_cost_this_month_usd: float

class DocumentTypeBreakdown(BaseModel):
    document_type: str
    count: int
    percentage: float

class RiskDistribution(BaseModel):
    department: str
    low: int
    medium: int
    high: int
    critical: int

class QueryLatencyStats(BaseModel):
    period: str
    retrieval_p50_ms: float
    retrieval_p95_ms: float
    retrieval_p99_ms: float
    generation_p50_ms: float
    generation_p95_ms: float
    total_p95_ms: float

class RAGQualityMetrics(BaseModel):
    period: str
    faithfulness_mean: float
    faithfulness_std: float
    answer_relevancy_mean: float
    context_precision_mean: float
    context_recall_mean: float
    citation_accuracy_mean: float
    hallucination_rate: float
    bleu_mean: float
    rouge_l_mean: float

class TokenUsageByProvider(BaseModel):
    provider: str
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    total_queries: int
    estimated_cost_usd: float


# ─── Admin Schemas ────────────────────────────────────────────────────────

class UserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(pattern="^(tenant_admin|document_manager|analyst|viewer|api_client)$")
    department: Optional[str] = None
    send_invitation: bool = True

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class UserListItem(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    department: Optional[str]
    is_active: bool
    is_mfa_enabled: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    documents_uploaded: int
    queries_last_30d: int

class AuditLogEntry(BaseModel):
    id: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    user_id: Optional[str]
    user_email: Optional[str]
    ip_address: Optional[str]
    success: bool
    failure_reason: Optional[str]
    risk_level: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]]

class TenantSettings(BaseModel):
    tenant_id: str
    company_name: str
    max_users: int
    max_documents: int
    max_storage_gb: float
    allowed_domains: List[str]
    features_enabled: List[str]
    compliance_frameworks: List[str]
    created_at: datetime

class APIKeyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    permissions: List[str]
    expires_in_days: Optional[int] = Field(default=365, ge=1, le=3650)

class APIKeyResponse(BaseModel):
    key_id: str
    key_value: str  # Only shown once on creation
    name: str
    permissions: List[str]
    expires_at: Optional[datetime]
    created_at: datetime


# ─── Evaluation Schemas ───────────────────────────────────────────────────

class EvalSampleCreate(BaseModel):
    question: str
    expected_answer: str
    ground_truth_contexts: List[str]
    document_ids: Optional[List[str]] = None

class EvalRunRequest(BaseModel):
    experiment_name: str
    description: Optional[str] = None
    sample_ids: Optional[List[str]] = None  # None = all samples
    retrieval_strategy: str = "hybrid"
    top_k: int = 5

class EvalResultSummary(BaseModel):
    experiment_name: str
    run_id: str
    total_samples: int
    faithfulness_mean: float
    answer_relevancy_mean: float
    context_precision_mean: float
    hallucination_rate: float
    bleu_mean: float
    rouge_l_mean: float
    retrieval_p95_ms: float
    total_p95_ms: float
    run_timestamp: datetime
    report_path: Optional[str]
