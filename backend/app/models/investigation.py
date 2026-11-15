from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.ids import new_id


class Investigation(Base):
    """One saved conversation with the agent (like one chat)."""

    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("inv"))
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    """Each question from the user and each answer from the agent."""

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("msg"))
    investigation_id: Mapped[str] = mapped_column(ForeignKey("investigations.id"), index=True)
    sender: Mapped[str] = mapped_column(String)   # "user" or "agent"
    content: Mapped[str] = mapped_column(Text)    # the question, or the answer summary
    # Only for agent messages: the structured answer (facts, inferences, unresolved)
    answer: Mapped[dict | None] = mapped_column(JSONB)
    # Only for agent messages: the steps/tools the agent used (the investigation trace)
    trace: Mapped[list | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
