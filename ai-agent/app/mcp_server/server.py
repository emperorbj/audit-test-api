"""Our MCP server: audit-log tools that the agent (or any MCP client) can use.

Each tool:
  1. takes the user's token from the request's Authorization header
  2. calls our backend API with it (so the backend applies that user's permissions)
  3. returns the backend's JSON

The token travels in HTTP headers only. The LLM never sees it.

Run it:   uv run python -m app.mcp_server.server     (listens on http://127.0.0.1:8002/mcp)
"""

from mcp.server.fastmcp import Context, FastMCP
from mcp.server.fastmcp.exceptions import ToolError

from app.core.config import settings
from app.tools.backend_client import BackendError, get_from_backend

mcp = FastMCP(
    name="audit-tools",
    instructions="Read-only tools over the organization's audit logs. Times are UTC, ISO 8601.",
    host=settings.mcp_host,  # 127.0.0.1 locally, 0.0.0.0 on Lambda (see config.py)
    port=settings.mcp_port,  # 8002 locally (the backend uses 8000)
    stateless_http=True,    # each request stands alone: no sessions to remember
    json_response=True,     # plain JSON answers (simpler than a stream for one-shot tools)
)


def user_token(ctx: Context) -> str:
    """Read the user's token from the Authorization header of the current request."""
    request = ctx.request_context.request  # the incoming HTTP request
    auth_header = request.headers.get("authorization", "") if request else ""
    if not auth_header.lower().startswith("bearer "):
        raise ToolError("Missing user token (Authorization: Bearer ...).")
    return auth_header.split(" ", 1)[1]


async def call_backend(ctx: Context, path: str, params: dict | None = None) -> dict:
    """Shared by every tool: call the backend as the user, turn failures into ToolErrors."""
    try:
        return await get_from_backend(path, user_token(ctx), params)
    except BackendError as error:
        raise ToolError(str(error))  # the LLM sees this message and can correct itself


# ---------------------------------------------------------------------------
# The tools. Their docstrings are what the LLM reads to choose and use them.
# ---------------------------------------------------------------------------

@mcp.tool()
async def search_audit_logs(
    ctx: Context,
    start: str | None = None,
    end: str | None = None,
    actor: str | None = None,
    action: str | None = None,
    domain: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    outcome: str | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> dict:
    """Search audit events, newest first. All filters are optional exact matches.

    start, end: ISO 8601 UTC times, e.g. "2026-11-10T00:00:00Z". No range = last 24 hours.
                The maximum range is 31 days.
    actor: who did it, e.g. "james.k".
    action: e.g. "login.failure", "customer.deleted", "role.grant", "approval.granted".
    domain: authentication, financial, customer_records, permissions, admin, approvals.
    resource_type / resource_id: the thing acted on, e.g. "customer" / "cus_7001".
    outcome: "success" or "failure".
    limit: events per page (max 100). If the result says truncated=true, call again
           with cursor=next_cursor to get the next page.
    """
    return await call_backend(ctx, "/audit-logs", {
        "start": start, "end": end, "actor": actor, "action": action, "domain": domain,
        "resource_type": resource_type, "resource_id": resource_id, "outcome": outcome,
        "limit": limit, "cursor": cursor,
    })


@mcp.tool()
async def get_audit_event(ctx: Context, event_id: str) -> dict:
    """Fetch ONE audit event by its ID (e.g. "evt_8f21a9c03e11"), exactly as recorded.
    Use it to check the details of an event before citing it.
    """
    return await call_backend(ctx, f"/audit-logs/{event_id}")


@mcp.tool()
async def get_user_activity(
    ctx: Context, actor: str, start: str | None = None, end: str | None = None,
    limit: int = 50, cursor: str | None = None,
) -> dict:
    """Everything one person did, newest first. actor = their username, e.g. "james.k".
    start/end: ISO 8601 UTC; no range = last 24 hours; max 31 days.
    """
    return await call_backend(ctx, "/audit-logs", {
        "actor": actor, "start": start, "end": end, "limit": limit, "cursor": cursor,
    })


@mcp.tool()
async def get_resource_history(
    ctx: Context, resource_id: str, start: str | None = None, end: str | None = None,
    limit: int = 50, cursor: str | None = None,
) -> dict:
    """Every event that touched one thing, newest first.
    resource_id examples: a customer "cus_7001", a user "omar.h", a ticket "CHG-2013".
    start/end: ISO 8601 UTC; no range = last 24 hours; max 31 days.
    """
    return await call_backend(ctx, "/audit-logs", {
        "resource_id": resource_id, "start": start, "end": end, "limit": limit, "cursor": cursor,
    })


@mcp.tool()
async def get_permission_changes(
    ctx: Context, start: str | None = None, end: str | None = None,
    actor: str | None = None, resource_id: str | None = None,
    limit: int = 50, cursor: str | None = None,
) -> dict:
    """Role and permission changes (role.grant, role.revoke), newest first.
    actor = who made the change; resource_id = whose permissions changed.
    details.ticket_id (when present) links a change to its approval: search the
    "approvals" domain for action "approval.granted" with the same ticket ID.
    start/end: ISO 8601 UTC; no range = last 24 hours; max 31 days.
    """
    return await call_backend(ctx, "/audit-logs", {
        "domain": "permissions", "actor": actor, "resource_id": resource_id,
        "start": start, "end": end, "limit": limit, "cursor": cursor,
    })


@mcp.tool()
async def get_login_history(
    ctx: Context, start: str | None = None, end: str | None = None,
    actor: str | None = None, outcome: str | None = None,
    limit: int = 50, cursor: str | None = None,
) -> dict:
    """Logins and logouts (login.success, login.failure, logout), newest first.
    outcome="failure" -> only failed logins. actor = whose account.
    start/end: ISO 8601 UTC; no range = last 24 hours; max 31 days.
    """
    return await call_backend(ctx, "/audit-logs", {
        "domain": "authentication", "actor": actor, "outcome": outcome,
        "start": start, "end": end, "limit": limit, "cursor": cursor,
    })


@mcp.tool()
async def get_activity_timeline(
    ctx: Context, start: str | None = None, end: str | None = None,
    actor: str | None = None, resource_id: str | None = None,
    limit: int = 100, cursor: str | None = None,
) -> dict:
    """Events for ONE actor or ONE resource in time order (OLDEST first), to rebuild
    what happened step by step. Give actor or resource_id (at least one).
    start/end: ISO 8601 UTC; no range = last 24 hours; max 31 days.
    """
    if not actor and not resource_id:
        raise ToolError("Give an actor or a resource_id for the timeline.")
    return await call_backend(ctx, "/audit-logs", {
        "oldest_first": True, "actor": actor, "resource_id": resource_id,
        "start": start, "end": end, "limit": limit, "cursor": cursor,
    })


if __name__ == "__main__":
    # Start the server over HTTP (MCP's "streamable HTTP" transport).
    mcp.run(transport="streamable-http")
