"""Check the agent's evidence with code, not AI: every cited event must really exist.

This enforces the spec's "zero fabricated events" rule.
"""

import asyncio

from pydantic import BaseModel

from app.agent.answer import AuditAnswer
from app.tools.backend_client import BackendError, get_from_backend


class CitationReport(BaseModel):
    ok: bool                            # True only if every check passed
    checked_event_ids: list[str]        # every ID the answer cited
    missing_event_ids: list[str]        # cited IDs that do NOT exist (fabricated or mistyped)
    facts_without_evidence: list[str]   # verified facts that cite no event at all


def cited_event_ids(answer: AuditAnswer) -> list[str]:
    """Every event ID in the facts and inferences, each only once, in order of appearance."""
    found = []
    for claim in answer.verified_facts + answer.inferences:
        for event_id in claim.event_ids:
            if event_id not in found:
                found.append(event_id)
    return found


async def event_exists(event_id: str, user_token: str) -> bool:
    """True if the backend has this event, False if it says 404 (not found)."""
    try:
        await get_from_backend(f"/audit-logs/{event_id}", user_token)
        return True
    except BackendError as error:
        if error.status_code == 404:
            return False
        raise  # any other problem (backend down...) means we could NOT check: don't hide it


async def check_citations(answer: AuditAnswer, user_token: str) -> CitationReport:
    """Check every cited event ID and every verified fact."""
    event_ids = cited_event_ids(answer)

    # Check all IDs at the same time instead of one after another (much faster).
    results = await asyncio.gather(*(event_exists(event_id, user_token) for event_id in event_ids))
    missing = [event_id for event_id, exists in zip(event_ids, results) if not exists]

    no_evidence = [fact.claim for fact in answer.verified_facts if not fact.event_ids]

    return CitationReport(
        ok=not missing and not no_evidence,
        checked_event_ids=event_ids,
        missing_event_ids=missing,
        facts_without_evidence=no_evidence,
    )
