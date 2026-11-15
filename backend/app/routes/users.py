"""User management. Org Admins only (US-09)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import DB, require_roles
from app.core.security import hash_password
from app.models import ROLE_ORG_ADMIN, User
from app.schemas.users import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

# Every endpoint in this file needs an Org Admin. `admin` is the logged-in admin.
Admin = Annotated[User, Depends(require_roles(ROLE_ORG_ADMIN))]


@router.get("", response_model=list[UserOut])
async def list_users(db: DB, admin: Admin):
    """All users."""
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate, db: DB, admin: Admin):
    """Create a user."""
    email = body.email.lower()

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    user = User(
        email=email,
        name=body.name,
        role=body.role,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    return user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, body: UserUpdate, db: DB, admin: Admin):
    """Change a user's name, role, or active status."""
    user = await db.get(User, user_id)  # look up by primary key
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Stop admins from locking themselves out by accident.
    if user.id == admin.id and (body.is_active is False or (body.role and body.role != ROLE_ORG_ADMIN)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can't deactivate yourself or remove your own admin role",
        )

    # Only change the fields that were sent.
    if body.name is not None:
        user.name = body.name
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active

    await db.commit()
    return user
