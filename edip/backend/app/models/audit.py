from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ─── Audit Log ────────────────────────────────────────────────────────────

class AuditAction(str, enum.Enum):
    # Auth
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    USER_LOGIN_FAILED = "user.login_failed"
    USER_MFA_VERIFIED = "user.mfa_verified"
    USER_PASSWORD_CHANGED = "user.password_changed"
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    USER_DEACTIVATED = "user.deactivated"
    USER_ROLE_CHANGED = "user.role_changed"

    # Documents
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_VIEWED = "document.viewed"
    DOCUMENT_DOWNLOADED = "document.downloaded"
    DOCUMENT_DELETED = "document.deleted"
    DOCUMENT_RESTORED = "document.restored"
    DOCUMENT_SHARED = "document.shared"
    DOCUMENT_VERSION_CREATED = "document.version_created"

    # AI / Query
    QUERY_SUBMITTED = "query.submitted"
    QUERY_COMPLETED = "query.completed"
    QUERY_FAILED = "query.failed"
    CHAT_SESSION_STARTED = "chat.session_started"
    CHAT_SESSION_ENDED = "chat.session_ended"

    # Admin
    ADMIN_USER_IMPERSONATED = "admin.user_impersonated"
    ADMIN_SETTINGS_CHANGED = "admin.settings_changed"
    ADMIN_ROLE_CREATED = "admin.role_created"
    ADMIN_EXPORT_TRIGGERED = "admin.export_triggered"

    # Security
    SECURITY_ACCESS_DENIED = "security.access_denied"
    SECURITY_RATE_LIMIT_HIT = "security.rate_limit_hit"
    SECURITY_SUSPICIOUS_ACTIVITY = "security.suspicious_activity"
    SECURITY_PII_ACCESSED = "security.pii_accessed"


class AuditLog(Base):

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_tenant_id", "tenant_id"),
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
        Index("ix_audit_logs_resource_id", "resource_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Action details
    action: Mapped[AuditAction] = mapped_column(Enum(AuditAction), nullable=False)
    resource_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Request context
    request_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Result
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    error_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Additional context (sanitized, no PII unless GDPR-masked)
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Immutable timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship
    user = relationship("User", back_populates="audit_logs", lazy="select")


# ─── Query / RAG Session ───────────────────────────────────────────────────

class QuerySession(Base):

    __tablename__ = "query_sessions"
    __table_args__ = (
        Index("ix_query_sessions_user_id", "user_id"),
        Index("ix_query_sessions_tenant_id", "tenant_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    document_ids: Mapped[Optional[list]] = mapped_column(JSONB, default=list)  # scoped documents
    total_turns: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens_used: Mapped[int] = mapped_column(BigInteger, default=0)
    total_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    queries: Mapped[list] = relationship(
        "QueryRecord", back_populates="session", order_by="QueryRecord.created_at"
    )


class QueryRecord(Base):
    """
    Individual query turn within a session.
    Full RAG pipeline trace: query → retrieval → reranking → LLM → response.
    Enables evaluation, debugging, and cost attribution.
    """

    __tablename__ = "query_records"
    __table_args__ = (
        Index("ix_query_records_session_id", "session_id"),
        Index("ix_query_records_tenant_id", "tenant_id"),
        Index("ix_query_records_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("query_sessions.id", ondelete="CASCADE"), nullable=False
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    # Query
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    query_language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    expanded_queries: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    # Retrieval
    retrieved_chunk_ids: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    retrieval_scores: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    reranked_chunk_ids: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    rerank_scores: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    retrieval_strategy: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    retrieval_latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # LLM
    llm_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    llm_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    prompt_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Response
    response_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    citations: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    answer_refused: Mapped[bool] = mapped_column(Boolean, default=False)
    refusal_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Quality signals
    hallucination_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    faithfulness_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    user_feedback: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # thumbs_up / thumbs_down
    user_feedback_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Latency
    total_latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    llm_latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship
    session: Mapped["QuerySession"] = relationship("QuerySession", back_populates="queries")


# ─── Evaluation Result ─────────────────────────────────────────────────────

class EvaluationRun(Base):
    """Stores evaluation experiment metadata and aggregate results."""

    __tablename__ = "evaluation_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    run_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evaluation_type: Mapped[str] = mapped_column(String(100), nullable=False)  # rag | ocr | retrieval

    # Config
    config: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Aggregate metrics
    metrics: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending")
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    results: Mapped[list] = relationship("EvaluationResult", back_populates="run")


class EvaluationResult(Base):
    """Stores per-sample evaluation results."""

    __tablename__ = "evaluation_results"
    __table_args__ = (
        Index("ix_eval_results_run_id", "run_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), nullable=False
    )

    sample_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    question: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actual_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    context_used: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    # Metrics
    faithfulness: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    answer_relevancy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    context_precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    context_recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hallucination_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    citation_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bleu_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rouge_l_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    raw_scores: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship
    run: Mapped["EvaluationRun"] = relationship("EvaluationRun", back_populates="results")


# ─── Analytics Event ───────────────────────────────────────────────────────

class AnalyticsEvent(Base):
    """
    High-throughput analytics event stream.
    Written async, read by analytics dashboards.
    """

    __tablename__ = "analytics_events"
    __table_args__ = (
        Index("ix_analytics_tenant_id_created_at", "tenant_id", "created_at"),
        Index("ix_analytics_event_type", "event_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # document.upload, query.success, ocr.complete, retrieval.success, etc.

    properties: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    # Flexible: latency_ms, tokens, cost, document_id, file_size, etc.

    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
