"""Security helpers: password hashing and JWT login tokens."""

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

# The recommended hasher (Argon2). Create it once and reuse it.
password_hasher = PasswordHash.recommended()

# A hash of a random password. Used when a login email doesn't exist,
# so a wrong email takes as long to check as a wrong password (see login route).
DUMMY_HASH = password_hasher.hash("dummy-password-for-timing")

JWT_ALGORITHM = "HS256"


def hash_password(plain_password: str) -> str:
    """Turn a real password into a hash we can safely store in the database."""
    return password_hasher.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a typed password against the stored hash. True = correct password."""
    return password_hasher.verify(plain_password, password_hash)


def create_access_token(user_id: str, role: str) -> str:
    """Create a signed login token (JWT) that says who the user is."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user_id,      # "subject": who this token is about
        "role": role,        # what they're allowed to do
        "exp": expires_at,   # when the token stops working (PyJWT checks this for us)
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Check a token's signature and expiry, then return its payload.

    Raises jwt.InvalidTokenError if the token is fake, tampered with, or expired.
    """
    return jwt.decode(token, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
