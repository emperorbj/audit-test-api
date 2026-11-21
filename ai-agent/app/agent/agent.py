"""The agent: a model (the brain) + MCP tools (the hands) + instructions (the rules)."""

from datetime import datetime, timezone

from deepagents import (
    GeneralPurposeSubagentProfile,
    HarnessProfile,
    create_deep_agent,
    register_harness_profile,
)
from langchain_anthropic import ChatAnthropic
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.agent.answer import AuditAnswer
from app.agent.prompts import SYSTEM_PROMPT
from app.core.config import settings

# No subagents: one agent does all the work itself.
# Deep Agents adds a "general-purpose" helper subagent (and a `task` tool) by default,
# even when we pass none. This turns it off for Claude (Anthropic) models.
register_harness_profile(
    "anthropic",
    HarnessProfile(general_purpose_subagent=GeneralPurposeSubagentProfile(enabled=False)),
)


def make_model() -> ChatAnthropic:
    """The agent's LLM (Claude): plans, searches with the tools, checks evidence, writes the answer."""
    if settings.anthropic_api_key is None:
        raise RuntimeError("ANTHROPIC_API_KEY is not set.")
    return ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,   # passed explicitly (see Lesson 8A)
        max_tokens=16000,                     # max length of ONE reply (the default is too big unless streaming)
        reasoning_effort="medium",            # how deeply Claude thinks before each step (low/medium/high/...)
        # If Claude's safety filter ever declines a request, Anthropic automatically
        # re-runs it on a suitable fallback model instead of failing.
        betas=["server-side-fallback-2026-07-01"],
        model_kwargs={"fallbacks": "default"},
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
    tools = await load_tools(user_token)
    return create_deep_agent(
        model=make_model(),
        tools=tools,
        system_prompt=SYSTEM_PROMPT.format(now=now),
        response_format=AuditAnswer,              # the final answer MUST have this shape
    )
