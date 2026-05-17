"""
Ingestion API (MongoDB)
"""

from __future__ import annotations

import uuid
from typing import Any, Dict

import structlog
from fastapi import APIRouter, Depends, UploadFile, File

from app.core.security import get_current_user

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    return {"message": "Document uploaded successfully", "filename": file.filename}
