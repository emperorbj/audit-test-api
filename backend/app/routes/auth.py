"""Endpoints for logging in and checking who you are."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser
from app.core.security import DUMMY_HASH, create_access_token, verify_password
from app.models import User
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.users import UserOut
from app.services.activity import log_activity

# A router is a small group of endpoints. main.py plugs it into the app.
# prefix="/auth" means every path below starts with /auth.
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: DB):
    """Check email + password. If correct, return a login token (JWT)."""

    # 1. Find the user by email (emails are stored lowercase).
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()  # the User, or None if no such email

    # 2. Check the password. If the user doesn't exist we still check against a
    #    dummy hash, so a wrong email takes as long as a wrong password.
    #    (Otherwise an attacker could time the response to learn which emails exist.)
    password_ok = verify_password(body.password, user.password_hash if user else DUMMY_HASH)

    # 3. Same error for "no such email", "wrong password" and "deactivated",
    #    so we never reveal which one it was.
    if user is None or not password_ok or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 4. Record the login in our activity log (append-only).
    log_activity(db, user_id=user.id, kind="login")
    await db.commit()

    # 5. Create the token and send it back with the user's public details.
    token = create_access_token(user_id=user.id, role=user.role)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    """Who am I? Returns the logged-in user (needs a valid token)."""
    return user
