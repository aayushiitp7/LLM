"""
Evaluation API (MongoDB)
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends

from app.core.security import get_current_user

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/evaluation", tags=["Evaluation"])

@router.get("/")
async def get_evaluations(current_user=Depends(get_current_user)):
    return {"message": "Evaluation API stub"}
