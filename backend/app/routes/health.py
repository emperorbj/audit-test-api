"""Health check: is the server up and can it reach the database?"""

from fastapi import APIRouter
from sqlalchemy import text

from app.core.dependencies import DB

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(db: DB):
    """Used by us and by AWS to check the service is alive."""
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}
