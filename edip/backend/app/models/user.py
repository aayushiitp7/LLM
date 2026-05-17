"""
Beanie Models — Users, Roles, Sessions

Enterprise multi-tenant user management with:
- RBAC (roles and permission matrix)
- Department isolation
- MFA support
- Soft deletes
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any

from beanie import Document, Indexed, Link
from pydantic import Field, EmailStr


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    MANAGER = "manager"
    ANALYST = "analyst"
    REVIEWER = "reviewer"
    VIEWER = "viewer"
    AUDITOR = "auditor"
    API_USER = "api_user"


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


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    DEACTIVATED = "deactivated"
    LOCKED = "locked"


class Tenant(Document):
    name: str
    slug: Indexed(str, unique=True)
    domain: Optional[str] = None
    plan: str = "enterprise"
    max_documents: int = 100000
    max_users: int = 500
    max_storage_gb: int = 500
    settings: dict = Field(default_factory=dict)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "tenants"


class User(Document):
    tenant_id: uuid.UUID
    email: Indexed(EmailStr, unique=True)
    username: str
    full_name: str
    hashed_password: str
    
    primary_role: UserRole = UserRole.VIEWER
    department: Department = Department.OPERATIONS
    
    status: UserStatus = UserStatus.PENDING_VERIFICATION
    is_active: bool = True
    is_verified: bool = False
    must_change_password: bool = False
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    mfa_backup_codes: Optional[List[str]] = None
    
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    timezone: str = "UTC"
    locale: str = "en-US"
    preferences: dict = Field(default_factory=dict)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = None
    last_login_ip: Optional[str] = None
    password_changed_at: Optional[datetime] = None
    
    deleted_at: Optional[datetime] = None
    is_deleted: bool = False

    class Settings:
        name = "users"
        indexes = [
            [("tenant_id", 1), ("email", 1)]
        ]


class UserSession(Document):
    user_id: uuid.UUID
    refresh_token_hash: Indexed(str)
    device_info: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    revoked_at: Optional[datetime] = None

    class Settings:
        name = "user_sessions"


class APIKey(Document):
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    name: str
    hashed_key: Indexed(str)
    key_prefix: str
    permissions: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None

    class Settings:
        name = "api_keys"
