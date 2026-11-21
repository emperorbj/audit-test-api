"""The investigation trace: which tools the agent called, with what, and what came back.

Shown in the UI so an auditor can see (and repeat) every step (scope US-05, FR-12).
"""

import json

# The agent's final, structured answer is delivered as a "tool call" too. It's not a step.
NOT_A_STEP = {"AuditAnswer"}


def result_count(tool_message) -> int | None:
    """How many events a tool returned, if we can tell (search results have a "count")."""
    try:
        data = json.loads(tool_message.text)
    except (ValueError, TypeError):
        return None
    if isinstance(data, dict):
        if "count" in data:
            return data["count"]
        if "event_id" in data:  # get_audit_event returns one event
            return 1
    return None


def build_trace(messages: list) -> list[dict]:
    """Turn the agent's messages into a list of steps, in the order they happened."""
    # Each tool result points back to the call it answers (tool_call_id).
    results = {m.tool_call_id: m for m in messages if m.type == "tool"}

    steps = []
    for message in messages:
        if message.type != "ai":
            continue
        for call in message.tool_calls:
            if call["name"] in NOT_A_STEP:
                continue
            result = results.get(call["id"])
            steps.append({
                "tool": call["name"],
                "args": call["args"],
                "ok": result is not None and getattr(result, "status", "success") != "error",
                "result_count": result_count(result) if result is not None else None,
            })
    return steps
