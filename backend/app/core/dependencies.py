"""Reusable FastAPI dependencies: the database session, the logged-in user, role checks.

Use them in any endpoint like this:

    @router.get("/something")
    async def something(db: DB, user: CurrentUser):
        ...

    @router.post("/admin-only", dependencies=[Depends(require_roles(ROLE_ORG_ADMIN))])
    async def admin_only(...):
        ...
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User

# Short name for "a database session". Saves typing the long version everywhere.
DB = Annotated[AsyncSession, Depends(get_db)]

# Reads the "Authorization: Bearer <token>" header for us.
# auto_error=False: if the header is missing we get None and send our own 401 below.
# (It also adds the "Authorize" button to the /docs page.)
bearer_scheme = HTTPBearer(auto_error=False)


def unauthorized(message: str) -> HTTPException:
    """A 401 error = "we don't know who you are"."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},  # standard hint: "send a Bearer token"
    )


async def get_current_user(
    db: DB,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    """Find out who is calling, from their token. Used by every protected endpoint."""

    # 1. Is there a token at all?
    if credentials is None:
        raise unauthorized("Not logged in")

    # 2. Is the token real (our signature) and not expired?
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise unauthorized("Login expired, please log in again")
    except jwt.InvalidTokenError:
        raise unauthorized("Invalid token")

    # 3. Load the user fresh from the database. This way, if an admin deactivates
    #    someone or changes their role, it takes effect immediately, not in an hour.
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise unauthorized("User not found or deactivated")

    return user


# Short name for "the logged-in user".
CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*allowed_roles: str):
    """Build a dependency that only lets in users with one of `allowed_roles`.

    Example: Depends(require_roles(ROLE_ORG_ADMIN, ROLE_INVESTIGATOR))
    """

    async def check_role(user: CurrentUser) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to do this",
            )
        return user

    return check_role
