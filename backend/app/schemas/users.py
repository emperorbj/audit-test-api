"""Shapes for user data going in and out of the API."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Only these three values are accepted for `role`. Anything else -> automatic 422 error.
Role = Literal["org_admin", "investigator", "viewer"]


class UserOut(BaseModel):
    """A user as we show them to the outside world. No password_hash here!"""

    # Lets us build this directly from a database User object:
    #   UserOut.model_validate(user)   (copies the matching fields, ignores the rest)
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    is_active: bool


class UserCreate(BaseModel):
    """POST /users body."""

    email: str = Field(min_length=3, max_length=200)
    name: str = Field(min_length=1, max_length=200)
    role: Role
    password: str = Field(min_length=8, max_length=200)


class UserUpdate(BaseModel):
    """PATCH /users/{id} body. Every field is optional: send only what you want to change."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    role: Role | None = None
    is_active: bool | None = None
