from __future__ import annotations

import json
import time
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator, List, Optional

import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import CurrentUser, get_current_user, require_permission
from app.database import get_db
from app.models.audit import AuditAction, AuditLog, AnalyticsEvent, QueryRecord, QuerySession
from app.models.document import Document

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/chat")


# ─── Pydantic Schemas ──────────────────────────────────────────────────────

class CitationSource(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    filename: str
    page_number: Optional[int]
    section: Optional[str]
    relevance_score: float
    content_snippet: str


class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    document_ids: Optional[List[str]] = Field(
        None, description="Scope query to specific documents (null = all tenant docs)"
    )
    session_id: Optional[str] = None
    retrieval_strategy: str = Field("hybrid", pattern="^(dense|sparse|hybrid)$")
    top_k: int = Field(5, ge=1, le=20)
    stream: bool = Field(True, description="Enable SSE streaming")
    language: Optional[str] = Field(None, description="Force response language (e.g., 'es', 'fr')")


class ChatQueryResponse(BaseModel):
    query_id: str
    session_id: str
    answer: str
    citations: List[CitationSource]
    confidence_score: float
    answer_refused: bool
    refusal_reason: Optional[str]
    sources_count: int
    retrieval_latency_ms: int
    total_latency_ms: int
    llm_provider: str
    llm_model: str
    tokens_used: int
    cost_usd: float
    created_at: datetime


class SessionCreateRequest(BaseModel):
    title: Optional[str] = None
    document_ids: Optional[List[str]] = None


class SessionResponse(BaseModel):
    session_id: str
    title: Optional[str]
    total_turns: int
    total_tokens_used: int
    total_cost_usd: float
    created_at: datetime
    last_activity_at: datetime


class FeedbackRequest(BaseModel):
    query_id: str
    feedback: str = Field(..., pattern="^(thumbs_up|thumbs_down)$")
    feedback_text: Optional[str] = Field(None, max_length=1000)


# ─── Retrieval Service Client ──────────────────────────────────────────────

async def call_retrieval_service(
    query: str,
    tenant_id: str,
    document_ids: Optional[List[str]],
    strategy: str,
    top_k: int,
) -> tuple[list, int]:
    """
    Call the retrieval microservice to get ranked chunks.
    Returns (chunks, latency_ms)
    """
    start = time.perf_counter()

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.RETRIEVAL_SERVICE_URL}/retrieve",
            json={
                "query": query,
                "tenant_id": tenant_id,
                "document_ids": document_ids,
                "strategy": strategy,
                "top_k": top_k,
                "rerank": True,
            },
        )
        response.raise_for_status()

    latency_ms = int((time.perf_counter() - start) * 1000)
    return response.json()["chunks"], latency_ms


async def call_llm_service(
    query: str,
    context_chunks: list,
    conversation_history: list,
    stream: bool,
    user_id: str,
    tenant_id: str,
) -> AsyncGenerator[str, None] | dict:
    """
    Call the LLM orchestration service.
    Returns streaming generator or complete response dict.
    """
    payload = {
        "query": query,
        "context_chunks": context_chunks,
        "conversation_history": conversation_history,
        "stream": stream,
        "user_id": user_id,
        "tenant_id": tenant_id,
    }

    if stream:
        async def stream_generator():
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{settings.LLM_SERVICE_URL}/generate/stream",
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_text():
                        yield chunk
        return stream_generator()
    else:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.LLM_SERVICE_URL}/generate",
                json=payload,
            )
            response.raise_for_status()
            return response.json()


# ─── Single-Turn RAG Query ─────────────────────────────────────────────────

@router.post(
    "/query",
    summary="RAG-powered document Q&A with source citations",
)
async def rag_query(
    request: Request,
    body: ChatQueryRequest,
    current_user: CurrentUser = Depends(require_permission("query:write")),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a natural language query against the document corpus.

    The pipeline:
    1. Query expansion (generates alternative phrasings)
    2. Hybrid retrieval (BM25 + dense semantic search)
    3. Cross-encoder reranking
    4. Context compression
    5. LLM generation with citation enforcement
    6. Hallucination guard (confidence threshold + source grounding)
    7. Response streaming via SSE

    All responses include source citations with document references, page numbers,
    and relevance scores. Low-confidence answers are refused with explanation.
    """
    query_id = str(uuid.uuid4())
    total_start = time.perf_counter()

    # Get or create session
    session_id = body.session_id or str(uuid.uuid4())

    # Get conversation history for multi-turn
    history = []
    if body.session_id:
        result = await db.execute(
            select(QueryRecord)
            .where(QueryRecord.session_id == uuid.UUID(body.session_id))
            .order_by(QueryRecord.created_at.desc())
            .limit(10)
        )
        past_queries = result.scalars().all()
        history = [
            {"role": "user", "content": q.query_text, "assistant": q.response_text}
            for q in reversed(past_queries)
            if q.response_text
        ]

    # Step 1: Retrieve relevant chunks
    try:
        chunks, retrieval_latency_ms = await call_retrieval_service(
            query=body.query,
            tenant_id=current_user.tenant_id,
            document_ids=body.document_ids,
            strategy=body.retrieval_strategy,
            top_k=body.top_k,
        )
    except Exception as exc:
        logger.error("chat.retrieval_failed", error=str(exc), query_id=query_id)
        raise HTTPException(status_code=503, detail="Retrieval service unavailable.")

    if not chunks:
        # No relevant documents found
        return ChatQueryResponse(
            query_id=query_id,
            session_id=session_id,
            answer="I could not find relevant information in your document corpus to answer this question. "
                   "Please ensure relevant documents are uploaded and indexed.",
            citations=[],
            confidence_score=0.0,
            answer_refused=True,
            refusal_reason="no_relevant_documents",
            sources_count=0,
            retrieval_latency_ms=retrieval_latency_ms,
            total_latency_ms=int((time.perf_counter() - total_start) * 1000),
            llm_provider="none",
            llm_model="none",
            tokens_used=0,
            cost_usd=0.0,
            created_at=datetime.now(timezone.utc),
        )

    # Step 2: Stream or batch LLM generation
    if body.stream:
        async def event_stream() -> AsyncGenerator[str, None]:
            """SSE stream with progressive token delivery."""
            full_response = ""
            llm_metadata = {}

            try:
                stream_gen = await call_llm_service(
                    query=body.query,
                    context_chunks=chunks,
                    conversation_history=history,
                    stream=True,
                    user_id=current_user.user_id,
                    tenant_id=current_user.tenant_id,
                )

                async for chunk in stream_gen:
                    if chunk.startswith("data: "):
                        data_str = chunk[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "token" in data:
                                full_response += data["token"]
                                yield f"data: {json.dumps({'type': 'token', 'content': data['token']})}\n\n"
                            elif "metadata" in data:
                                llm_metadata = data["metadata"]
                        except json.JSONDecodeError:
                            continue

                # Build citations from retrieved chunks
                citations = [
                    {
                        "chunk_id": c["id"],
                        "document_id": c["document_id"],
                        "document_title": c.get("document_title", "Unknown"),
                        "filename": c.get("filename", ""),
                        "page_number": c.get("page_number"),
                        "section": c.get("section"),
                        "relevance_score": c.get("score", 0.0),
                        "content_snippet": c["content"][:300],
                    }
                    for c in chunks[:settings.RERANK_TOP_K]
                ]

                # Final metadata event
                final_event = {
                    "type": "done",
                    "query_id": query_id,
                    "session_id": session_id,
                    "citations": citations,
                    "confidence_score": llm_metadata.get("confidence", 0.8),
                    "answer_refused": llm_metadata.get("refused", False),
                    "tokens_used": llm_metadata.get("tokens", 0),
                    "cost_usd": llm_metadata.get("cost", 0.0),
                    "llm_provider": llm_metadata.get("provider", "openai"),
                    "llm_model": llm_metadata.get("model", "gpt-4o"),
                    "retrieval_latency_ms": retrieval_latency_ms,
                    "total_latency_ms": int((time.perf_counter() - total_start) * 1000),
                }
                yield f"data: {json.dumps(final_event)}\n\n"

                # Log query record
                record = QueryRecord(
                    id=uuid.UUID(query_id),
                    session_id=uuid.UUID(session_id),
                    tenant_id=uuid.UUID(current_user.tenant_id),
                    user_id=uuid.UUID(current_user.user_id),
                    query_text=body.query,
                    retrieved_chunk_ids=[c["id"] for c in chunks],
                    retrieval_scores=[c.get("score", 0) for c in chunks],
                    retrieval_strategy=body.retrieval_strategy,
                    retrieval_latency_ms=retrieval_latency_ms,
                    response_text=full_response,
                    citations=citations,
                    confidence_score=llm_metadata.get("confidence", 0.8),
                    llm_provider=llm_metadata.get("provider", "openai"),
                    llm_model=llm_metadata.get("model", "gpt-4o"),
                    total_tokens=llm_metadata.get("tokens", 0),
                    cost_usd=llm_metadata.get("cost", 0.0),
                    total_latency_ms=int((time.perf_counter() - total_start) * 1000),
                )
                db.add(record)

                event = AnalyticsEvent(
                    tenant_id=uuid.UUID(current_user.tenant_id),
                    user_id=uuid.UUID(current_user.user_id),
                    event_type="query.success",
                    properties={
                        "latency_ms": int((time.perf_counter() - total_start) * 1000),
                        "tokens": llm_metadata.get("tokens", 0),
                        "chunks_retrieved": len(chunks),
                    },
                )
                db.add(event)
                await db.commit()

            except Exception as exc:
                logger.error("chat.stream_error", error=str(exc), query_id=query_id)
                yield f"data: {json.dumps({'type': 'error', 'message': 'Generation failed'})}\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )
    else:
        # Non-streaming response
        response_data = await call_llm_service(
            query=body.query,
            context_chunks=chunks,
            conversation_history=history,
            stream=False,
            user_id=current_user.user_id,
            tenant_id=current_user.tenant_id,
        )

        citations = [
            CitationSource(
                chunk_id=c["id"],
                document_id=c["document_id"],
                document_title=c.get("document_title", "Unknown"),
                filename=c.get("filename", ""),
                page_number=c.get("page_number"),
                section=c.get("section"),
                relevance_score=c.get("score", 0.0),
                content_snippet=c["content"][:300],
            )
            for c in chunks[:settings.RERANK_TOP_K]
        ]

        total_latency_ms = int((time.perf_counter() - total_start) * 1000)

        record = QueryRecord(
            id=uuid.UUID(query_id),
            session_id=uuid.UUID(session_id),
            tenant_id=uuid.UUID(current_user.tenant_id),
            user_id=uuid.UUID(current_user.user_id),
            query_text=body.query,
            response_text=response_data.get("answer", ""),
            confidence_score=response_data.get("confidence", 0.8),
            llm_provider=response_data.get("provider", "openai"),
            llm_model=response_data.get("model", "gpt-4o"),
            total_tokens=response_data.get("tokens", 0),
            cost_usd=response_data.get("cost", 0.0),
            total_latency_ms=total_latency_ms,
            retrieval_latency_ms=retrieval_latency_ms,
            citations=[c.model_dump() for c in citations],
        )
        db.add(record)
        await db.commit()

        return ChatQueryResponse(
            query_id=query_id,
            session_id=session_id,
            answer=response_data.get("answer", ""),
            citations=citations,
            confidence_score=response_data.get("confidence", 0.8),
            answer_refused=response_data.get("refused", False),
            refusal_reason=response_data.get("refusal_reason"),
            sources_count=len(chunks),
            retrieval_latency_ms=retrieval_latency_ms,
            total_latency_ms=total_latency_ms,
            llm_provider=response_data.get("provider", "openai"),
            llm_model=response_data.get("model", "gpt-4o"),
            tokens_used=response_data.get("tokens", 0),
            cost_usd=response_data.get("cost", 0.0),
            created_at=datetime.now(timezone.utc),
        )


# ─── Session Management ────────────────────────────────────────────────────

@router.post("/sessions", response_model=SessionResponse, summary="Create chat session")
async def create_session(
    body: SessionCreateRequest,
    current_user: CurrentUser = Depends(require_permission("query:write")),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = QuerySession(
        tenant_id=uuid.UUID(current_user.tenant_id),
        user_id=uuid.UUID(current_user.user_id),
        title=body.title,
        document_ids=[str(d) for d in (body.document_ids or [])],
    )
    db.add(session)
    await db.flush()

    return SessionResponse(
        session_id=str(session.id),
        title=session.title,
        total_turns=0,
        total_tokens_used=0,
        total_cost_usd=0.0,
        created_at=session.created_at,
        last_activity_at=session.created_at,
    )


@router.get("/sessions", response_model=List[SessionResponse], summary="List chat sessions")
async def list_sessions(
    current_user: CurrentUser = Depends(require_permission("query:read")),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
) -> List[SessionResponse]:
    result = await db.execute(
        select(QuerySession)
        .where(
            QuerySession.user_id == uuid.UUID(current_user.user_id),
            QuerySession.tenant_id == uuid.UUID(current_user.tenant_id),
        )
        .order_by(QuerySession.last_activity_at.desc())
        .limit(limit)
        .offset(offset)
    )
    sessions = result.scalars().all()

    return [
        SessionResponse(
            session_id=str(s.id),
            title=s.title,
            total_turns=s.total_turns,
            total_tokens_used=s.total_tokens_used,
            total_cost_usd=s.total_cost_usd,
            created_at=s.created_at,
            last_activity_at=s.last_activity_at,
        )
        for s in sessions
    ]


@router.post(
    "/sessions/{session_id}/feedback",
    status_code=204,
    summary="Submit answer feedback",
)
async def submit_feedback(
    session_id: str,
    body: FeedbackRequest,
    current_user: CurrentUser = Depends(require_permission("query:write")),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Record thumbs up/down feedback for continuous improvement."""
    await db.execute(
        update(QueryRecord)
        .where(QueryRecord.id == uuid.UUID(body.query_id))
        .values(
            user_feedback=body.feedback,
            user_feedback_text=body.feedback_text,
        )
    )
