"""Write to our own activity log (who asked what, which tools ran)."""

from app.models import ActivityLog


def log_activity(db, *, kind: str, user_id: str | None = None,
                 investigation_id: str | None = None, detail: dict | None = None) -> None:
    """Add one row to the activity log. The CALLER must commit.

    kind examples: "login", "audit_log_search", "question", "answer".
    The log is append-only: nothing in the app ever updates or deletes these rows.
    """
    db.add(ActivityLog(
        user_id=user_id,
        investigation_id=investigation_id,
        kind=kind,
        detail=detail or {},
    ))
