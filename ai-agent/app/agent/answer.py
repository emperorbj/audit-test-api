"""The shape of every answer the agent gives. The model MUST reply in this shape.

The Field descriptions are sent to the LLM: they tell it what goes where.
"""

from pydantic import BaseModel, Field


class Claim(BaseModel):
    """One statement plus the events that support it."""

    claim: str = Field(description="One clear statement, in plain language.")
    event_ids: list[str] = Field(
        description="The IDs of the audit events that support this statement, "
                    "exactly as returned by the tools (e.g. 'evt_3f9a1c2b7d4e')."
    )


class AuditAnswer(BaseModel):
    """The agent's final answer to an audit question."""

    summary: str = Field(description="One or two sentences that directly answer the question.")
    verified_facts: list[Claim] = Field(
        description="Statements proven by events the tools returned. Every one MUST list its "
                    "event IDs. Never put a search that returned nothing here (it has no event "
                    "to cite): say it in the summary and in unresolved instead."
    )
    inferences: list[Claim] = Field(
        description="Reasonable conclusions that are NOT proven, with the events they are based on. "
                    "Empty list if none."
    )
    unresolved: list[str] = Field(
        description="What could not be checked or confirmed, and why (missing data, limits, "
                    "suspicious log content), including searches that returned nothing. "
                    "Empty list if none."
    )
