"""The agent: a model (the brain) + MCP tools (the hands) + instructions (the rules)."""

from datetime import datetime, timezone

from deepagents import create_deep_agent
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI

from app.agent.prompts import SYSTEM_PROMPT
from app.core.config import settings


def make_model() -> ChatOpenAI:
    """The LLM that thinks and decides which tools to call."""
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,  # passed explicitly (see Lesson 8A)
    )


async def load_tools(user_token: str):
    """Connect to our MCP server AS THE USER and get the audit tools.

    The token goes into the HTTP headers of every tool call. The LLM never sees it.
    """
    client = MultiServerMCPClient({
        "audit": {
            "transport": "streamable_http",
            "url": settings.mcp_server_url,
            "headers": {"Authorization": f"Bearer {user_token}"},
        }
    })
    return await client.get_tools()


async def build_agent(user_token: str):
    """Create an agent that works on behalf of the user who owns `user_token`."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    return create_deep_agent(
        model=make_model(),
        tools=await load_tools(user_token),
        system_prompt=SYSTEM_PROMPT.format(now=now),
    )
