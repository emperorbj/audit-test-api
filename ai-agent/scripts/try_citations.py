"""Try the citation checker on hand-written answers (no AI, no MCP server needed).

Run from the ai-agent folder:   uv run python -m scripts.try_citations
"""

import asyncio

from app.agent.answer import AuditAnswer, Claim
from app.agent.citations import check_citations
from scripts.try_backend_client import login

# Planted deletion events from the seed data (their IDs are the same after every reseed).
REAL_IDS = ["evt_bef7ffe976ab", "evt_a341837a7935", "evt_b91d1389b372"]


async def main():
    token = await login("investigator@acme.test", "Password123!")

    honest = AuditAnswer(
        summary="kofi.d and lena.r deleted customer records.",
        verified_facts=[
            Claim(claim="kofi.d deleted cus_7001 and cus_7002.", event_ids=REAL_IDS[:2]),
            Claim(claim="lena.r deleted cus_7003.", event_ids=REAL_IDS[2:]),
        ],
        inferences=[],
        unresolved=[],
    )

    dishonest = AuditAnswer(
        summary="Three people deleted customer records.",
        verified_facts=[
            Claim(claim="kofi.d deleted cus_7001.", event_ids=[REAL_IDS[0]]),
            Claim(claim="tom.b deleted cus_9999.", event_ids=["evt_000000000000"]),  # made up!
            Claim(claim="Someone else deleted records too.", event_ids=[]),           # no evidence!
        ],
        inferences=[],
        unresolved=[],
    )

    for name, answer in [("HONEST answer", honest), ("DISHONEST answer", dishonest)]:
        report = await check_citations(answer, token)
        print(f"{name}:")
        print(f"  ok:                     {report.ok}")
        print(f"  checked event IDs:      {report.checked_event_ids}")
        print(f"  missing (fabricated):   {report.missing_event_ids}")
        print(f"  facts without evidence: {report.facts_without_evidence}\n")


if __name__ == "__main__":
    asyncio.run(main())
