"""Ask the agent a question and watch every step LIVE, with safety limits.

1. Start the MCP server in one terminal:   uv run python -m app.mcp_server.server
2. Run this in a second terminal:          uv run python -m scripts.try_agent "your question"

Press Ctrl + C at any time to stop (and stop spending tokens).
"""

import asyncio
import sys
import time

from app.agent.agent import build_agent
from app.agent.citations import check_citations
from scripts.try_backend_client import login

DEFAULT_QUESTION = "Who deleted customer records yesterday?"

MAX_STEPS = 100         # same limit as the agent API (app/main.py)
MAX_SECONDS = 4 * 60    # we cancel the run after this long


def short(text, limit=200) -> str:
    """Shorten long text for printing."""
    text = str(text).replace("\n", " ")
    return text if len(text) <= limit else text[:limit] + " ..."


def as_list(value) -> list:
    """Messages in an update can be one message or a list; always give a list."""
    if value is None:
        return []
    return list(value) if isinstance(value, (list, tuple)) else [value]


def print_message(message) -> None:
    """Print one step: a tool call or a tool result."""
    kind = getattr(message, "type", None)
    if kind == "ai":
        for call in message.tool_calls or []:
            print(f"🤖 CALLS {call['name']}({short(call['args'], 250)})")
    elif kind == "tool":
        status = "❌ ERROR " if getattr(message, "status", "") == "error" else "📦 RESULT"
        print(f"   {status} {short(message.text, 150)}")


async def run(agent, question: str):
    """Run the agent, printing each step as it happens. Returns the final state."""
    final_state = None
    async for mode, chunk in agent.astream(
        {"messages": [{"role": "user", "content": question}]},
        config={"recursion_limit": MAX_STEPS},
        stream_mode=["updates", "values"],  # "updates" = each step, "values" = the full state
    ):
        if mode == "values":
            final_state = chunk  # the agent's latest full state
        elif mode == "updates":
            for update in chunk.values():
                if isinstance(update, dict):
                    for message in as_list(update.get("messages")):
                        print_message(message)
    return final_state


async def main(question: str):
    token = await login("investigator@acme.test", "Password123!")  # normally from the frontend
    agent = await build_agent(token)

    print(f"QUESTION: {question}\n(limits: {MAX_STEPS} steps, {MAX_SECONDS // 60} minutes)\n")
    started = time.monotonic()
    try:
        state = await asyncio.wait_for(run(agent, question), timeout=MAX_SECONDS)
    except asyncio.TimeoutError:
        print(f"\n⏱️  Stopped: the run took longer than {MAX_SECONDS // 60} minutes.")
        return
    print(f"\n⏱️  Took {time.monotonic() - started:.0f} seconds.")

    answer = (state or {}).get("structured_response")
    if answer is None:
        print("No structured answer was produced.")
        return

    print("=" * 80)
    print(f"SUMMARY: {answer.summary}\n")
    print("VERIFIED FACTS:")
    for fact in answer.verified_facts:
        print(f"  - {fact.claim}\n      evidence: {', '.join(fact.event_ids) or '(none!)'}")
    print("\nINFERENCES:")
    for item in answer.inferences or []:
        print(f"  - {item.claim}\n      based on: {', '.join(item.event_ids) or '-'}")
    if not answer.inferences:
        print("  (none)")
    print("\nUNRESOLVED / LIMITATIONS:")
    for item in answer.unresolved or ["(none)"]:
        print(f"  - {item}")

    # Check the evidence with code (no AI): every cited event must really exist.
    report = await check_citations(answer, token)
    print("\nCITATION CHECK:")
    if report.ok:
        print(f"  ✅ all {len(report.checked_event_ids)} cited events exist, every fact has evidence")
    else:
        print("  ⚠️  NOT TRUSTWORTHY")
        print(f"     cited events that don't exist: {report.missing_event_ids}")
        print(f"     facts without evidence:        {report.facts_without_evidence}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_QUESTION))
