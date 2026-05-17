"""
Admin API — Tenant and user management (MongoDB)
"""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user, hash_api_key
from app.models.user import User, UserRole, APIKey
from app.models.audit import AuditLog
from app.schemas import (
    UserCreateRequest, UserUpdateRequest, UserListItem,
    AuditLogEntry, APIKeyCreateRequest, APIKeyResponse, MessageResponse
)

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

def _require_admin(current_user=Depends(get_current_user)):
    if current_user.role not in (UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Admin role required.")
    return current_user

@router.get("/users")
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user=Depends(_require_admin)
) -> Dict[str, Any]:
    query = User.find(User.tenant_id == uuid.UUID(current_user.tenant_id), User.is_deleted == False)
    
    if search:
        query = query.find({"$or": [{"email": {"$regex": search, "$options": "i"}}, {"full_name": {"$regex": search, "$options": "i"}}]})
    if role:
        query = query.find(User.primary_role == role)

    total = await query.count()
    users = await query.sort("-created_at").skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "total": total, "page": page, "page_size": page_size,
        "items": [
            UserListItem(
                id=str(u.id), email=u.email, full_name=u.full_name,
                role=u.primary_role.value, department=u.department.value,
                is_active=u.is_active, is_mfa_enabled=u.mfa_enabled,
                last_login_at=u.last_login_at, created_at=u.created_at,
                documents_uploaded=0, queries_last_30d=0
            ) for u in users
        ]
    }

@router.post("/api-keys", status_code=status.HTTP_201_CREATED, response_model=APIKeyResponse)
async def create_api_key(
    request: APIKeyCreateRequest,
    current_user=Depends(_require_admin)
) -> APIKeyResponse:
    raw_key = "edip_" + secrets.token_urlsafe(40)
    hashed = hash_api_key(raw_key)
    key_prefix = raw_key[:12]

    expires_at = datetime.now(timezone.utc) + timedelta(days=request.expires_in_days) if request.expires_in_days else None

    api_key = APIKey(
        tenant_id=uuid.UUID(current_user.tenant_id),
        user_id=uuid.UUID(current_user.id),
        name=request.name,
        hashed_key=hashed,
        key_prefix=key_prefix,
        permissions=request.permissions,
        expires_at=expires_at
    )
    await api_key.insert()

    return APIKeyResponse(
        key_id=str(api_key.id), key_value=raw_key, name=request.name,
        permissions=request.permissions, expires_at=expires_at, created_at=api_key.created_at
    )
