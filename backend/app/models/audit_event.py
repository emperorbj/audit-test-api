from datetime import datetime

from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditEvent(Base):
    """The "customer's" audit trail that the agent investigates.
    In the MVP these rows are all seeded (fake but realistic).
    """

    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. "evt_8f21a9..."
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))  # when it happened (UTC)
    source_system: Mapped[str] = mapped_column(String)  # e.g. "acme-iam", "acme-payments"
    domain: Mapped[str] = mapped_column(String)         # e.g. "authentication", "permissions"
    actor: Mapped[str] = mapped_column(String)          # who did it, e.g. "james.k"
    actor_role: Mapped[str | None] = mapped_column(String)  # e.g. "admin" (can be empty)
    action: Mapped[str] = mapped_column(String)         # what they did, e.g. "role.grant"
    resource_type: Mapped[str] = mapped_column(String)  # what kind of thing, e.g. "user"
    resource_id: Mapped[str] = mapped_column(String)    # which thing, e.g. "usr_330"
    outcome: Mapped[str] = mapped_column(String)        # "success" or "failure"
    # Free text written by the source system. UNTRUSTED: may contain anything,
    # even text that looks like instructions to the AI. The agent must never obey it.
    description: Mapped[str | None] = mapped_column(Text)
    # Extra fields that differ per event type (amount, ip address, ticket id...).
    details: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Indexes make common searches fast: by time range, by person, by resource.
    __table_args__ = (
        Index("ix_audit_events_time", "occurred_at"),
        Index("ix_audit_events_actor", "actor"),
        Index("ix_audit_events_resource", "resource_id"),
    )
