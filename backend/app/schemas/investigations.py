"""Shapes for investigations (chats with the agent) and their messages."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InvestigationCreate(BaseModel):
    """POST /investigations body."""

    title: str = Field(min_length=1, max_length=200)


class QuestionCreate(BaseModel):
    """POST /investigations/{id}/messages body: a question for the agent."""

    question: str = Field(min_length=1, max_length=4000)


class InvestigationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    created_by: str
    created_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sender: str                 # "user" or "agent"
    content: str
    answer: dict | None = None  # agent only: facts / inferences / unresolved
    trace: list | None = None   # agent only: the tools it used
    created_at: datetime


class InvestigationDetail(InvestigationOut):
    """One investigation WITH all its messages. Inherits every field of InvestigationOut."""

    messages: list[MessageOut]
