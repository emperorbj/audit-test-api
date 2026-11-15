"""The agent activity log: who asked what, which tools ran (US-10). Org Admins only."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.core.dependencies import DB, require_roles
from app.models import ROLE_ORG_ADMIN, ActivityLog, User
from app.schemas.activity import ActivityPage

router = APIRouter(prefix="/activity-log", tags=["activity log"])

Admin = Annotated[User, Depends(require_roles(ROLE_ORG_ADMIN))]


@router.get("", response_model=ActivityPage)
async def read_activity_log(
    db: DB,
    admin: Admin,
    user_id: str | None = None,           # only this user's activity
    investigation_id: str | None = None,  # only this investigation
    kind: str | None = None,              # e.g. "tool_call"
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    cursor: str | None = None,            # next_cursor from the previous page
):
    """Newest first. Read-only: there is no endpoint to change or delete log entries."""
    try:
        offset = int(cursor) if cursor else 0
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cursor")

    query = select(ActivityLog)
    if user_id:
        query = query.where(ActivityLog.user_id == user_id)
    if investigation_id:
        query = query.where(ActivityLog.investigation_id == investigation_id)
    if kind:
        query = query.where(ActivityLog.kind == kind)

    query = query.order_by(ActivityLog.id.desc()).offset(offset).limit(limit + 1)
    rows = (await db.execute(query)).scalars().all()

    has_more = len(rows) > limit
    return ActivityPage(
        items=rows[:limit],
        next_cursor=str(offset + limit) if has_more else None,
    )
