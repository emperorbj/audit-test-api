"""Investigations: saved conversations with the agent (like chats)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser, require_roles
from app.models import ROLE_INVESTIGATOR, ROLE_ORG_ADMIN, Investigation, Message, User
from app.schemas.investigations import (
    InvestigationCreate,
    InvestigationDetail,
    InvestigationOut,
    MessageOut,
)

router = APIRouter(prefix="/investigations", tags=["investigations"])

# Org Admins and Investigators may start investigations. Viewers may only read them.
Investigator = Annotated[User, Depends(require_roles(ROLE_ORG_ADMIN, ROLE_INVESTIGATOR))]


@router.post("", response_model=InvestigationOut, status_code=status.HTTP_201_CREATED)
async def create_investigation(body: InvestigationCreate, db: DB, user: Investigator):
    """Start a new, empty investigation (like clicking "New chat")."""
    investigation = Investigation(created_by=user.id, title=body.title)
    db.add(investigation)
    await db.commit()
    return investigation


@router.get("", response_model=list[InvestigationOut])
async def list_investigations(db: DB, user: CurrentUser):
    """All investigations, newest first. Any role."""
    result = await db.execute(select(Investigation).order_by(Investigation.created_at.desc()))
    return result.scalars().all()


@router.get("/{investigation_id}", response_model=InvestigationDetail)
async def read_investigation(investigation_id: str, db: DB, user: CurrentUser):
    """One investigation with all its messages. Any role."""
    investigation = await db.get(Investigation, investigation_id)
    if investigation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")

    messages = await db.execute(
        select(Message).where(Message.investigation_id == investigation.id).order_by(Message.created_at)
    )
    return InvestigationDetail(
        id=investigation.id,
        title=investigation.title,
        created_by=investigation.created_by,
        created_at=investigation.created_at,
        messages=[MessageOut.model_validate(m) for m in messages.scalars().all()],
    )
