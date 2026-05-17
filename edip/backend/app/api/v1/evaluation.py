"""
Evaluation API — Run RAG evaluations and view results
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

from app.database import get_db
from app.core.security import get_current_user
from app.schemas import EvalRunRequest, EvalResultSummary

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/evaluation", tags=["Evaluation"])

@router.post("/run", response_model=Dict[str, str])
async def trigger_evaluation_run(
    request: EvalRunRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """Trigger an async RAG evaluation run."""
    # In a real app, this dispatches a Celery task
    logger.info("eval.triggered", experiment=request.experiment_name, by=str(current_user.id))
    return {"message": "Evaluation run triggered", "run_id": "eval-" + request.experiment_name}

@router.get("/runs", response_model=List[EvalResultSummary])
async def list_evaluation_runs(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[EvalResultSummary]:
    """List historical evaluation runs."""
    return []
