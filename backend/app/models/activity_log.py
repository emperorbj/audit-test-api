from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ActivityLog(Base):
    """The agent's OWN audit trail. We only ever INSERT rows here, never update or delete."""

    __tablename__ = "activity_log"

    id: Mapped[int] = mapped_column(primary_key=True)  # 1, 2, 3... (auto-increment)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    investigation_id: Mapped[str | None] = mapped_column(ForeignKey("investigations.id"))
    kind: Mapped[str] = mapped_column(String)     # "question", "tool_call", "answer", "login"
    detail: Mapped[dict] = mapped_column(JSONB, default=dict)  # what exactly happened
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
