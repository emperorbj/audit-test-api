"""Shapes of audit events sent back by the /audit-logs endpoints."""

from datetime import datetime

from pydantic import BaseModel


class AuditEventOut(BaseModel):
    event_id: str
    occurred_at: datetime
    source_system: str
    domain: str
    actor: str
    actor_role: str | None
    action: str
    resource_type: str
    resource_id: str
    outcome: str
    description: str | None  # untrusted text from the source system
    details: dict            # sensitive fields already redacted


class AuditEventPage(BaseModel):
    """One page of search results."""

    time_range: dict          # the start/end actually used
    note: str | None          # explains any default we applied (e.g. "last 24 hours")
    count: int                # events on this page
    truncated: bool           # True = more results exist; use next_cursor
    next_cursor: str | None
    events: list[AuditEventOut]
