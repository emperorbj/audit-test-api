"""Reading the audit logs. These are the endpoints the agent's MCP tools will call.

Any logged-in user can read the audit logs. The agent calls these with the
user's token, so it gets exactly the same access as the user.
"""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import DB, CurrentUser
from app.schemas.audit_logs import AuditEventOut, AuditEventPage
from app.services.activity import log_activity
from app.services.audit_queries import MAX_PAGE_SIZE, QueryError, get_event, search_events

router = APIRouter(prefix="/audit-logs", tags=["audit logs"])


@router.get("", response_model=AuditEventPage)
async def search_audit_logs(
    db: DB,
    user: CurrentUser,
    start: datetime | None = None,      # no range given -> last 24 hours
    end: datetime | None = None,
    actor: str | None = None,           # who did it, e.g. "james.k"
    action: str | None = None,          # e.g. "customer.deleted"
    domain: str | None = None,          # e.g. "permissions"
    resource_type: str | None = None,   # e.g. "customer"
    resource_id: str | None = None,     # e.g. "cus_7001"
    outcome: str | None = None,         # "success" or "failure"
    oldest_first: bool = False,         # True for timelines
    limit: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = 50,
    cursor: str | None = None,          # next_cursor from the previous page
):
    """Search audit events. Filters are exact matches; leave out what you don't need."""
    filters = dict(actor=actor, action=action, domain=domain, resource_type=resource_type,
                   resource_id=resource_id, outcome=outcome)
    try:
        page = await search_events(db, start, end, **filters,
                                   limit=limit, cursor=cursor, oldest_first=oldest_first)
    except QueryError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Record who searched for what (the agent's tool calls show up here too).
    log_activity(db, user_id=user.id, kind="audit_log_search",
                 detail={"filters": {k: v for k, v in filters.items() if v},
                         "time_range": page["time_range"], "result_count": page["count"]})
    await db.commit()
    return page


@router.get("/{event_id}", response_model=AuditEventOut)
async def read_audit_event(event_id: str, db: DB, user: CurrentUser):
    """One event by ID, e.g. to verify a citation."""
    event = await get_event(db, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event
