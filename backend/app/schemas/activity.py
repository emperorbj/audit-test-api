"""Shapes for the agent activity log (GET /activity-log)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str | None
    investigation_id: str | None
    kind: str      # e.g. "login", "audit_log_search"
    detail: dict
    created_at: datetime


class ActivityPage(BaseModel):
    items: list[ActivityOut]
    next_cursor: str | None  # pass this back as ?cursor=... to get the next page
