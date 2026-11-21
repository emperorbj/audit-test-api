"""Investigations: saved conversations with the agent (like chats)."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser, UserToken, require_roles
from app.models import ROLE_INVESTIGATOR, ROLE_ORG_ADMIN, Investigation, Message, User
from app.schemas.investigations import (
    InvestigationCreate,
    InvestigationDetail,
    InvestigationOut,
    MessageOut,
    QuestionCreate,
)
from app.services.activity import log_activity
from app.services.agent_client import AgentError, ask_agent

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


@router.post("/{investigation_id}/messages", response_model=list[MessageOut])
async def ask_question(
    investigation_id: str, body: QuestionCreate, db: DB, user: Investigator, token: UserToken
):
    """Ask the agent a question in this investigation. Waits for the answer (up to ~5 minutes).

    Returns the two new messages: the question and the agent's answer.
    Viewers can't ask (they may only read investigations).
    """
    investigation = await db.get(Investigation, investigation_id)
    if investigation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")

    asked_at = datetime.now(timezone.utc)

    # 1. Record the question in the activity log FIRST, so it's logged even if the agent fails.
    log_activity(db, kind="question", user_id=user.id, investigation_id=investigation.id,
                 detail={"question": body.question})
    await db.commit()

    # 2. Ask the agent, as this user (it gets exactly this user's access).
    try:
        result = await ask_agent(body.question, token)
    except AgentError as error:
        log_activity(db, kind="agent_error", user_id=user.id, investigation_id=investigation.id,
                     detail={"error": str(error)})
        await db.commit()
        raise HTTPException(status_code=error.status_code, detail=str(error))

    # 3. Save the question and the answer.
    answer = result["answer"]
    # created_at=asked_at: the question comes before the answer (otherwise both would get
    # the same time, because they're saved together).
    question_message = Message(investigation_id=investigation.id, sender="user",
                               content=body.question, created_at=asked_at)
    answer_message = Message(
        investigation_id=investigation.id,
        sender="agent",
        content=answer["summary"],
        # The structured answer, plus our citation check and how long it took.
        answer={**answer, "citations": result["citations"], "seconds": result["seconds"]},
        trace=result["trace"],  # the tools the agent called (investigation trace)
    )
    db.add_all([question_message, answer_message])
    log_activity(db, kind="answer", user_id=user.id, investigation_id=investigation.id,
                 detail={"trace": result["trace"], "citations_ok": result["citations"]["ok"],
                         "seconds": result["seconds"]})
    await db.commit()

    # Reload both, to get the created_at times the database filled in.
    await db.refresh(question_message)
    await db.refresh(answer_message)
    return [question_message, answer_message]
