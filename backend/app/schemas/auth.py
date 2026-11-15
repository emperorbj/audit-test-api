"""Shapes of the data that goes IN and OUT of the /auth endpoints.

FastAPI uses these to:
  - check incoming JSON (wrong or missing fields -> automatic 422 error)
  - shape outgoing JSON (only the fields listed here are sent back)
  - draw the /docs page
"""

from pydantic import BaseModel

from app.schemas.users import UserOut


class LoginRequest(BaseModel):
    """What the client sends to POST /auth/login."""

    email: str
    password: str


class LoginResponse(BaseModel):
    """What POST /auth/login sends back."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut
