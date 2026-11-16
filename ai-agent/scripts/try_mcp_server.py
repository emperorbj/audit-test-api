"""Try the MCP server by hand (no AI involved), connecting the SAME way the agent will.

1. Start the server in one terminal:   uv run python -m app.mcp_server.server
2. Run this in a second terminal:      uv run python -m scripts.try_mcp_server
"""

import asyncio
import json
from datetime import datetime, timedelta, timezone

from langchain_mcp_adapters.client import MultiServerMCPClient

from scripts.try_backend_client import login

MCP_SERVER_URL = "http://127.0.0.1:8002/mcp"


def as_data(result):
    """The adapters return the tool's JSON as text blocks; turn it back into a dict."""
    text = result if isinstance(result, str) else result[0]["text"]
    return json.loads(text)


async def main():
    token = await login("investigator@acme.test", "Password123!")

    # Connect to our MCP server, sending the user's token in a header (never to the LLM).
    client = MultiServerMCPClient({
        "audit": {
            "transport": "streamable_http",
            "url": MCP_SERVER_URL,
            "headers": {"Authorization": f"Bearer {token}"},
        }
    })

    # 1. The tools the LLM will be shown, with the inputs each one REQUIRES.
    tools = {tool.name: tool for tool in await client.get_tools()}
    print(f"The server offers {len(tools)} tools:")
    for name, tool in tools.items():
        required = tool.args_schema.get("required", [])
        print(f"  {name:24} required inputs: {required or '-'}")

    # 2. A mini investigation, done by hand: permission changes in the last 7 days.
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
    changes = as_data(await tools["get_permission_changes"].ainvoke({"start": week_ago, "limit": 100}))
    print(f"\nget_permission_changes (last 7 days): {changes['count']} changes")

    first = changes["events"][0]
    print(f"  newest: {first['occurred_at']} {first['actor']} {first['action']} -> "
          f"{first['resource_id']} (ticket: {first['details'].get('ticket_id', 'none')})")

    # 3. Look at that one event exactly, like checking a citation.
    event = as_data(await tools["get_audit_event"].ainvoke({"event_id": first["event_id"]}))
    print(f"\nget_audit_event({first['event_id']}): source={event['source_system']}, "
          f"details={event['details']}")

    # 4. A timeline for the admin who made it (oldest first).
    timeline = as_data(await tools["get_activity_timeline"].ainvoke({"actor": first["actor"], "start": week_ago}))
    print(f"\nget_activity_timeline(actor={first['actor']}): {timeline['count']} events, oldest first:")
    for e in timeline["events"][:4]:
        print(f"  {e['occurred_at']}  {e['action']}")

    # 5. A mistake on purpose: a timeline without saying for whom.
    print("\nget_activity_timeline() with no actor/resource (on purpose):")
    try:
        await tools["get_activity_timeline"].ainvoke({})
    except Exception as error:
        print(f"  {type(error).__name__}: {error}")


if __name__ == "__main__":
    asyncio.run(main())
