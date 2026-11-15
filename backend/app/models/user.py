from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.ids import new_id

# The three roles a user can have.
ROLE_ORG_ADMIN = "org_admin"
ROLE_INVESTIGATOR = "investigator"
ROLE_VIEWER = "viewer"
ALL_ROLES = [ROLE_ORG_ADMIN, ROLE_INVESTIGATOR, ROLE_VIEWER]


class User(Base):
    """A person who logs in to our app. Has one role."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("usr"))
    email: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    password_hash: Mapped[str] = mapped_column(String)  # never the real password
    role: Mapped[str] = mapped_column(String)            # one of ALL_ROLES
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
