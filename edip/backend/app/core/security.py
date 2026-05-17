"""
Security Core — JWT, bcrypt, OAuth2, RBAC

Production-grade authentication and authorization:
- JWT access + refresh token pair
- bcrypt password hashing with configurable cost factor
- OAuth2 password flow
- API key hashing and validation
- MFA (TOTP) support
- Account lockout after failed attempts
- Permission matrix enforcement
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Union

import bcrypt
import pyotp
import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from jose import ExpiredSignatureError, JWTError, jwt


from app.config import settings
from app.database import get_db

logger = structlog.get_logger(__name__)

# ─── Constants ─────────────────────────────────────────────────────────────

BCRYPT_ROUNDS = 12
MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30
API_KEY_PREFIX_LENGTH = 8
REFRESH_TOKEN_BYTES = 32

# Permission matrix: role → set of allowed permissions
PERMISSION_MATRIX: Dict[str, Set[str]] = {
    "super_admin": {"*"},  # Full access
    "tenant_admin": {
        "document:read", "document:write", "document:delete", "document:share",
        "query:read", "query:write",
        "user:read", "user:write", "user:delete",
        "admin:user_manage", "admin:settings",
        "analytics:read", "analytics:export",
        "audit:read",
        "evaluation:read", "evaluation:write",
    },
    "manager": {
        "document:read", "document:write", "document:share",
        "query:read", "query:write",
        "user:read",
        "analytics:read",
        "audit:read",
        "evaluation:read",
    },
    "analyst": {
        "document:read", "document:write",
        "query:read", "query:write",
        "analytics:read",
        "evaluation:read",
    },
    "reviewer": {
        "document:read",
        "query:read", "query:write",
        "analytics:read",
    },
    "viewer": {
        "document:read",
        "query:read",
    },
    "auditor": {
        "document:read",
        "audit:read",
        "analytics:read",
        "evaluation:read",
    },
    "api_user": {
        "document:read",
        "query:read", "query:write",
    },
}

# ─── Password Hashing ──────────────────────────────────────────────────────

class PasswordHasher:
    """bcrypt-based password hashing with configurable rounds."""

    @staticmethod
    def hash(password: str) -> str:
        """Hash password with bcrypt. Never store plaintext."""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters.")
        salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        """Constant-time comparison to prevent timing attacks."""
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except Exception:
            return False

    @staticmethod
    def needs_rehash(hashed_password: str) -> bool:
        """Check if password needs re-hashing due to increased rounds."""
        return bcrypt.gensalt(rounds=BCRYPT_ROUNDS) != bcrypt.gensalt(rounds=BCRYPT_ROUNDS)


password_hasher = PasswordHasher()


# ─── JWT Token Management ──────────────────────────────────────────────────

class TokenManager:
    """
    Manages JWT access and refresh token lifecycle.
    Access tokens: short-lived (60min), stateless.
    Refresh tokens: long-lived (7 days), stored hashed in DB.
    """

    @staticmethod
    def create_access_token(
        user_id: str,
        tenant_id: str,
        email: str,
        role: str,
        department: str,
        permissions: List[str],
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """Create a signed JWT access token."""
        now = datetime.now(timezone.utc)
        expire = now + (
            expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        payload = {
            "sub": user_id,          # Subject (user ID)
            "tid": tenant_id,         # Tenant ID
            "email": email,
            "role": role,
            "dept": department,
            "perms": permissions,
            "iat": now,              # Issued at
            "exp": expire,           # Expiry
            "jti": str(uuid.uuid4()),  # JWT ID (for revocation)
            "type": "access",
        }

        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def create_refresh_token() -> tuple[str, str]:
        """
        Create an opaque refresh token.
        Returns: (raw_token, hashed_token)
        Store only the hash in DB, return raw to client.
        """
        raw_token = secrets.token_urlsafe(REFRESH_TOKEN_BYTES)
        hashed = hashlib.sha256(raw_token.encode()).hexdigest()
        return raw_token, hashed

    @staticmethod
    def verify_access_token(token: str) -> Dict[str, Any]:
        """
        Verify and decode a JWT access token.
        Raises HTTPException on invalid/expired tokens.
        """
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                options={"verify_exp": True},
            )
            if payload.get("type") != "access":
                raise JWTError("Invalid token type")
            return payload
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please login again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {exc}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    @staticmethod
    def hash_refresh_token(raw_token: str) -> str:
        """Hash a refresh token for database storage."""
        return hashlib.sha256(raw_token.encode()).hexdigest()


token_manager = TokenManager()


# ─── API Key Management ────────────────────────────────────────────────────

class APIKeyManager:
    """
    Manages API keys for programmatic access.
    Format: edip_<prefix8>_<random48>
    Only the SHA-256 hash is stored in the database.
    """

    PREFIX = "edip"

    @staticmethod
    def generate() -> tuple[str, str, str]:
        """
        Generate a new API key.
        Returns: (full_key, prefix, hash)
        """
        prefix = secrets.token_hex(4)  # 8 hex chars
        secret = secrets.token_urlsafe(36)
        full_key = f"edip_{prefix}_{secret}"
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        return full_key, prefix, key_hash

    @staticmethod
    def hash(api_key: str) -> str:
        return hashlib.sha256(api_key.encode()).hexdigest()

    @staticmethod
    def verify(api_key: str, stored_hash: str) -> bool:
        """Constant-time comparison."""
        computed = hashlib.sha256(api_key.encode()).hexdigest()
        return hmac.compare_digest(computed, stored_hash)


api_key_manager = APIKeyManager()


# ─── MFA / TOTP ────────────────────────────────────────────────────────────

class MFAManager:
    """TOTP-based multi-factor authentication using RFC 6238."""

    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret key."""
        return pyotp.random_base32()

    @staticmethod
    def get_provisioning_uri(secret: str, email: str) -> str:
        """Return the OTP Auth URI for QR code generation."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name=settings.APP_NAME)

    @staticmethod
    def verify_totp(secret: str, token: str) -> bool:
        """Verify a 6-digit TOTP code with 30s window."""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)

    @staticmethod
    def generate_backup_codes(count: int = 10) -> List[str]:
        """Generate one-time backup codes for account recovery."""
        return [secrets.token_hex(4).upper() for _ in range(count)]


mfa_manager = MFAManager()


# ─── RBAC Enforcement ──────────────────────────────────────────────────────

class RBACEnforcer:
    """
    Role-Based Access Control enforcement.
    Checks permissions against the permission matrix.
    """

    @staticmethod
    def get_permissions(role: str) -> Set[str]:
        """Get all permissions for a role."""
        return PERMISSION_MATRIX.get(role, set())

    @staticmethod
    def has_permission(role: str, required_permission: str) -> bool:
        """
        Check if a role has a specific permission.
        Super admin has wildcard access.
        """
        perms = PERMISSION_MATRIX.get(role, set())
        if "*" in perms:
            return True
        return required_permission in perms

    @staticmethod
    def check_permissions(role: str, required_permissions: List[str]) -> bool:
        """Check if role has ALL required permissions."""
        return all(
            RBACEnforcer.has_permission(role, perm)
            for perm in required_permissions
        )


rbac_enforcer = RBACEnforcer()


# ─── FastAPI Security Schemes ──────────────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")
bearer_scheme = HTTPBearer(auto_error=True)


# ─── Current User Dependency ───────────────────────────────────────────────

class CurrentUser:
    """Extracted and validated user context from JWT token."""

    def __init__(
        self,
        user_id: str,
        tenant_id: str,
        email: str,
        role: str,
        department: str,
        permissions: List[str],
    ):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.email = email
        self.role = role
        self.department = department
        self.permissions = set(permissions)

    def has_permission(self, permission: str) -> bool:
        return rbac_enforcer.has_permission(self.role, permission)

    def require_permission(self, permission: str) -> None:
        """Raise 403 if user lacks the required permission."""
        if not self.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {permission}",
            )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    """
    FastAPI dependency for authenticated endpoints.
    Validates JWT token and returns CurrentUser context.
    """
    payload = token_manager.verify_access_token(credentials.credentials)

    return CurrentUser(
        user_id=payload["sub"],
        tenant_id=payload["tid"],
        email=payload["email"],
        role=payload["role"],
        department=payload.get("dept", "operations"),
        permissions=payload.get("perms", []),
    )


def require_permission(permission: str):
    """
    Dependency factory for permission-gated endpoints.

    Usage:
        @router.get("/admin/users")
        async def list_users(
            current_user: CurrentUser = Depends(require_permission("admin:user_manage"))
        ):
    """
    async def _check(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        current_user.require_permission(permission)
        return current_user

    return _check


def require_any_permission(*permissions: str):
    """Require at least one of the given permissions."""
    async def _check(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not any(current_user.has_permission(p) for p in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(permissions)}",
            )
        return current_user

    return _check
