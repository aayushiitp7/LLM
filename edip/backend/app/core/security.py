"""
Simplified Security Core
"""
from typing import List, Set
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

class CurrentUser:
    def __init__(self, user_id: str, tenant_id: str, email: str, role: str):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.email = email
        self.role = role

    def has_permission(self, permission: str) -> bool:
        return True

    def require_permission(self, permission: str) -> None:
        pass

bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(credentials=Depends(bearer_scheme)) -> CurrentUser:
    """Mock user for simplified local testing."""
    return CurrentUser(
        user_id="local_user",
        tenant_id="local_tenant",
        email="demo@edip.internal",
        role="super_admin"
    )

def require_permission(permission: str):
    async def _check(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        return current_user
    return _check

