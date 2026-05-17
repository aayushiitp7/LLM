from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, SecretStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import (
    CurrentUser,
    MFAManager,
    PasswordHasher,
    TokenManager,
    api_key_manager,
    get_current_user,
    mfa_manager,
    password_hasher,
    rbac_enforcer,
    token_manager,
)
from app.database import get_db
from app.models.audit import AuditAction, AuditLog
from app.models.user import Department, User, UserRole, UserSession, UserStatus

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/auth")


# ─── Pydantic Schemas ──────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    user_id: str
    email: str
    role: str
    mfa_required: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    username: str = Field(..., min_length=3, max_length=100)
    department: Department = Department.OPERATIONS
    tenant_id: Optional[str] = None


class MFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    backup_codes: list[str]


class MFAVerifyRequest(BaseModel):
    totp_code: str = Field(..., min_length=6, max_length=8)


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    username: str
    role: str
    department: str
    status: str
    mfa_enabled: bool
    avatar_url: Optional[str]
    created_at: datetime
    last_login_at: Optional[datetime]


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class APIKeyResponse(BaseModel):
    api_key: str  # Shown ONCE, never again
    prefix: str
    created_at: datetime


# ─── Helper Functions ──────────────────────────────────────────────────────

async def _create_session_and_tokens(
    user: User,
    db: AsyncSession,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> TokenResponse:
    """Create access + refresh token pair and store session."""

    # Get permissions from role
    permissions = list(rbac_enforcer.get_permissions(user.primary_role.value))

    access_token = token_manager.create_access_token(
        user_id=str(user.id),
        tenant_id=str(user.tenant_id),
        email=user.email,
        role=user.primary_role.value,
        department=user.department.value,
        permissions=permissions,
    )

    raw_refresh, hashed_refresh = token_manager.create_refresh_token()

    # Store session
    session = UserSession(
        user_id=user.id,
        refresh_token_hash=hashed_refresh,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(session)

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    user.last_login_ip = ip_address
    user.failed_login_attempts = 0

    await db.flush()

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        user_id=str(user.id),
        email=user.email,
        role=user.primary_role.value,
    )


async def _record_audit(
    db: AsyncSession,
    action: AuditAction,
    success: bool,
    request: Request,
    user_id: Optional[uuid.UUID] = None,
    tenant_id: Optional[uuid.UUID] = None,
    metadata: Optional[dict] = None,
) -> None:
    """Write an immutable audit log entry."""
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=user_id,
        action=action,
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        endpoint=str(request.url.path),
        method=request.method,
        success=success,
        metadata=metadata,
    )
    db.add(audit)


# ─── Login ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse, summary="Authenticate and obtain JWT tokens")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    OAuth2 password flow. Returns access + refresh tokens.
    Enforces account lockout after repeated failures.
    If MFA is enabled, returns mfa_required=True and a short-lived pre-auth token.
    """
    # Find user by email
    result = await db.execute(
        select(User).where(
            User.email == form_data.username.lower().strip(),
            User.is_deleted.is_(False),
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        logger.warning("auth.login_failed", email=form_data.username, reason="user_not_found")
        await _record_audit(db, AuditAction.USER_LOGIN_FAILED, False, request,
                           metadata={"email": form_data.username, "reason": "not_found"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Check account status
    if user.status == UserStatus.LOCKED:
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked until {user.locked_until.isoformat()}. Contact admin.",
            )
        # Lock expired — reset
        user.status = UserStatus.ACTIVE
        user.failed_login_attempts = 0

    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Contact your administrator.",
        )

    if user.status == UserStatus.DEACTIVATED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated.",
        )

    # Verify password
    if not password_hasher.verify(form_data.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1

        if user.failed_login_attempts >= 5:
            user.status = UserStatus.LOCKED
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
            logger.warning("auth.account_locked", user_id=str(user.id))

        await _record_audit(db, AuditAction.USER_LOGIN_FAILED, False, request,
                           user_id=user.id, tenant_id=user.tenant_id,
                           metadata={"attempts": user.failed_login_attempts})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Check MFA requirement
    if user.mfa_enabled:
        # Return pre-auth token that requires MFA step
        pre_auth_token = token_manager.create_access_token(
            user_id=str(user.id),
            tenant_id=str(user.tenant_id),
            email=user.email,
            role=user.primary_role.value,
            department=user.department.value,
            permissions=[],
            expires_delta=timedelta(minutes=5),
        )
        return TokenResponse(
            access_token=pre_auth_token,
            refresh_token="",
            user_id=str(user.id),
            email=user.email,
            role=user.primary_role.value,
            mfa_required=True,
        )

    # Issue full tokens
    tokens = await _create_session_and_tokens(
        user, db,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await _record_audit(db, AuditAction.USER_LOGIN, True, request,
                       user_id=user.id, tenant_id=user.tenant_id)

    logger.info("auth.login_success", user_id=str(user.id), role=user.primary_role.value)
    return tokens


# ─── MFA Verify ───────────────────────────────────────────────────────────

@router.post("/mfa/verify", response_model=TokenResponse, summary="Complete MFA verification")
async def verify_mfa(
    request: Request,
    body: MFAVerifyRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Verify TOTP code after successful password login."""
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(current_user.user_id))
    )
    user = result.scalar_one_or_none()
    if not user or not user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA not configured.")

    if not mfa_manager.verify_totp(user.mfa_secret, body.totp_code):
        await _record_audit(db, AuditAction.USER_LOGIN_FAILED, False, request,
                           user_id=user.id, metadata={"reason": "mfa_failed"})
        raise HTTPException(status_code=401, detail="Invalid MFA code.")

    tokens = await _create_session_and_tokens(
        user, db,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await _record_audit(db, AuditAction.USER_MFA_VERIFIED, True, request, user_id=user.id)
    return tokens


# ─── Refresh Token ─────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(
    request: Request,
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Exchange a valid refresh token for a new access + refresh pair."""
    token_hash = token_manager.hash_refresh_token(body.refresh_token)

    result = await db.execute(
        select(UserSession).where(
            UserSession.refresh_token_hash == token_hash,
            UserSession.is_active.is_(True),
            UserSession.revoked_at.is_(None),
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    if session.expires_at < datetime.now(timezone.utc):
        session.is_active = False
        raise HTTPException(status_code=401, detail="Refresh token expired. Please login again.")

    # Load user
    result = await db.execute(
        select(User).where(User.id == session.user_id, User.is_deleted.is_(False))
    )
    user = result.scalar_one_or_none()
    if not user or user.status not in (UserStatus.ACTIVE,):
        raise HTTPException(status_code=401, detail="User account unavailable.")

    # Revoke old session (token rotation)
    session.is_active = False
    session.revoked_at = datetime.now(timezone.utc)

    # Issue new token pair
    tokens = await _create_session_and_tokens(
        user, db,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return tokens


# ─── Logout ───────────────────────────────────────────────────────────────

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Revoke session")
async def logout(
    request: Request,
    body: RefreshRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Revoke the current refresh token, invalidating the session."""
    token_hash = token_manager.hash_refresh_token(body.refresh_token)

    await db.execute(
        update(UserSession)
        .where(
            UserSession.refresh_token_hash == token_hash,
            UserSession.user_id == uuid.UUID(current_user.user_id),
        )
        .values(is_active=False, revoked_at=datetime.now(timezone.utc))
    )

    await _record_audit(db, AuditAction.USER_LOGOUT, True, request,
                       user_id=uuid.UUID(current_user.user_id),
                       tenant_id=uuid.UUID(current_user.tenant_id))


# ─── Current User Profile ─────────────────────────────────────────────────

@router.get("/me", response_model=UserProfileResponse, summary="Get current user profile")
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    """Return the authenticated user's profile."""
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(current_user.user_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        username=user.username,
        role=user.primary_role.value,
        department=user.department.value,
        status=user.status.value,
        mfa_enabled=user.mfa_enabled,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


# ─── MFA Setup ────────────────────────────────────────────────────────────

@router.post("/mfa/setup", response_model=MFASetupResponse, summary="Set up TOTP MFA")
async def setup_mfa(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MFASetupResponse:
    """Generate MFA secret and provisioning URI. User must verify before activation."""
    secret = mfa_manager.generate_secret()
    provisioning_uri = mfa_manager.get_provisioning_uri(secret, current_user.email)
    backup_codes = mfa_manager.generate_backup_codes()

    # Store pending secret (not yet enabled until verified)
    await db.execute(
        update(User)
        .where(User.id == uuid.UUID(current_user.user_id))
        .values(mfa_secret=secret, mfa_backup_codes=backup_codes)
    )

    return MFASetupResponse(
        secret=secret,
        provisioning_uri=provisioning_uri,
        backup_codes=backup_codes,
    )


@router.post("/mfa/enable", status_code=204, summary="Enable MFA after verification")
async def enable_mfa(
    body: MFAVerifyRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Confirm TOTP code to activate MFA on the account."""
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(current_user.user_id))
    )
    user = result.scalar_one_or_none()

    if not user or not user.mfa_secret:
        raise HTTPException(status_code=400, detail="Call /mfa/setup first.")

    if not mfa_manager.verify_totp(user.mfa_secret, body.totp_code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code.")

    user.mfa_enabled = True


# ─── API Key Generation ────────────────────────────────────────────────────

@router.post("/api-key", response_model=APIKeyResponse, summary="Generate API key")
async def generate_api_key(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> APIKeyResponse:
    """Generate a new API key. The full key is shown ONCE — store it securely."""
    full_key, prefix, key_hash = api_key_manager.generate()

    await db.execute(
        update(User)
        .where(User.id == uuid.UUID(current_user.user_id))
        .values(api_key_hash=key_hash, api_key_prefix=prefix)
    )

    return APIKeyResponse(
        api_key=full_key,
        prefix=prefix,
        created_at=datetime.now(timezone.utc),
    )
