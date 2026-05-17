"""
Search API (MongoDB)
"""

from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List, Optional

import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas import SearchRequest, SearchResponse, SearchResult
from app.models.audit import QueryRecord

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/search", tags=["Search"])

@router.post("", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    current_user=Depends(get_current_user),
) -> SearchResponse:
    start = time.perf_counter()
    search_time_ms = int((time.perf_counter() - start) * 1000)

    return SearchResponse(
        query=request.query,
        results=[],
        total_results=0,
        strategy_used=request.strategy,
        search_time_ms=search_time_ms,
        facets={},
    )

@router.get("/suggest")
async def suggest(
    q: str = Query(min_length=2, max_length=200),
    current_user=Depends(get_current_user),
) -> Dict[str, List[str]]:
    return {"suggestions": []}

@router.get("/history")
async def search_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    records = await QueryRecord.find(QueryRecord.user_id == uuid.UUID(current_user.id)).sort("-created_at").skip((page - 1) * page_size).limit(page_size).to_list()
    return {
        "items": [
            {
                "id": str(r.id),
                "query": r.query_text,
                "results_count": r.results_count,
                "retrieval_strategy": r.retrieval_strategy,
                "timestamp": r.created_at.isoformat(),
            }
            for r in records
        ],
        "page": page,
        "page_size": page_size,
    }
