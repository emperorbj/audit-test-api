"""All database tables.

Importing them here means:
  1. other code can write `from app.models import User, AuditEvent`
  2. importing `app.models` registers EVERY table on Base (Alembic needs that)
"""

from app.models.activity_log import ActivityLog
from app.models.audit_event import AuditEvent
from app.models.investigation import Investigation, Message
from app.models.user import (
    ALL_ROLES,
    ROLE_INVESTIGATOR,
    ROLE_ORG_ADMIN,
    ROLE_VIEWER,
    User,
)

__all__ = [
    "ActivityLog", "AuditEvent", "Investigation", "Message", "User",
    "ALL_ROLES", "ROLE_INVESTIGATOR", "ROLE_ORG_ADMIN", "ROLE_VIEWER",
]
