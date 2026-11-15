"""Reading audit events (used by the /audit-logs endpoints). The rules:

  - every time range is at most 31 days; no range given -> last 24 hours
  - at most 100 events per page; `next_cursor` fetches the next page
  - sensitive fields are redacted
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.models import AuditEvent
from app.services.redaction import redact_details

MAX_RANGE_DAYS = 31
MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 50
DEFAULT_RANGE_HOURS = 24


class QueryError(Exception):
    """A problem with the request itself (bad range, bad cursor). Message is shown to the caller."""


def as_utc(moment: datetime) -> datetime:
    """Times without a time zone are treated as UTC."""
    if moment.tzinfo is None:
        return moment.replace(tzinfo=timezone.utc)
    return moment


def resolve_time_range(start: datetime | None, end: datetime | None):
    """Fill in missing times with defaults, check the limits.

    Returns (start, end, note). `note` explains any default we applied (FR-5),
    so the agent can tell the user "I used the last 24 hours".
    """
    now = datetime.now(timezone.utc)
    note = None

    if start is None and end is None:
        end, start = now, now - timedelta(hours=DEFAULT_RANGE_HOURS)
        note = "No time range was given, so the last 24 hours were used."
    elif start is None:
        end = as_utc(end)
        start = end - timedelta(hours=DEFAULT_RANGE_HOURS)
        note = "No start time was given, so the 24 hours before the end time were used."
    elif end is None:
        start, end = as_utc(start), now
        note = "No end time was given, so 'now' was used."
    else:
        start, end = as_utc(start), as_utc(end)

    if start >= end:
        raise QueryError("start must be before end.")
    if end - start > timedelta(days=MAX_RANGE_DAYS):
        raise QueryError(f"Time range too long. The maximum is {MAX_RANGE_DAYS} days; split it into smaller ranges.")
    return start, end, note


def event_to_dict(event: AuditEvent) -> dict:
    """One event as plain JSON-friendly data, with sensitive fields redacted.
    IDs, timestamps and source systems are passed through unchanged (evidence integrity).
    """
    return {
        "event_id": event.id,
        "occurred_at": event.occurred_at.isoformat(),
        "source_system": event.source_system,
        "domain": event.domain,
        "actor": event.actor,
        "actor_role": event.actor_role,
        "action": event.action,
        "resource_type": event.resource_type,
        "resource_id": event.resource_id,
        "outcome": event.outcome,
        "description": event.description,
        "details": redact_details(event.details),
    }


async def search_events(
    db,
    start: datetime | None = None,
    end: datetime | None = None,
    *,
    actor: str | None = None,
    action: str | None = None,
    domain: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    outcome: str | None = None,
    limit: int = DEFAULT_PAGE_SIZE,
    cursor: str | None = None,
    oldest_first: bool = False,
) -> dict:
    """Find events that match the filters. Filters left as None are ignored."""
    start, end, note = resolve_time_range(start, end)
    limit = max(1, min(limit, MAX_PAGE_SIZE))

    # The cursor is simply "how many events to skip" (the position of the next page).
    try:
        offset = int(cursor) if cursor else 0
    except ValueError:
        raise QueryError("Invalid cursor. Use the next_cursor value from a previous result.")

    # Always: inside the time range.
    query = select(AuditEvent).where(
        AuditEvent.occurred_at >= start,
        AuditEvent.occurred_at < end,
    )
    # Optional filters: only added when given.
    if actor:
        query = query.where(AuditEvent.actor == actor)
    if action:
        query = query.where(AuditEvent.action == action)
    if domain:
        query = query.where(AuditEvent.domain == domain)
    if resource_type:
        query = query.where(AuditEvent.resource_type == resource_type)
    if resource_id:
        query = query.where(AuditEvent.resource_id == resource_id)
    if outcome:
        query = query.where(AuditEvent.outcome == outcome)

    # Newest first by default; timelines want oldest first. `id` breaks ties so pages are stable.
    if oldest_first:
        query = query.order_by(AuditEvent.occurred_at.asc(), AuditEvent.id.asc())
    else:
        query = query.order_by(AuditEvent.occurred_at.desc(), AuditEvent.id.asc())

    # Ask for ONE extra row: if it comes back, we know there is another page.
    rows = (await db.execute(query.offset(offset).limit(limit + 1))).scalars().all()
    has_more = len(rows) > limit
    events = rows[:limit]

    return {
        "time_range": {"start": start.isoformat(), "end": end.isoformat()},
        "note": note,
        "count": len(events),
        "truncated": has_more,  # True = there are more results than shown here
        "next_cursor": str(offset + limit) if has_more else None,
        "events": [event_to_dict(e) for e in events],
    }


async def get_event(db, event_id: str) -> dict | None:
    """One event by ID, or None if it doesn't exist."""
    event = await db.get(AuditEvent, event_id)
    return event_to_dict(event) if event else None

