"""Ask the agent a question and watch every step it takes.

1. Start the MCP server in one terminal:   uv run python -m app.mcp_server.server
2. Run this in a second terminal:          uv run python -m scripts.try_agent "your question"
"""

import asyncio
import sys

from app.agent.agent import build_agent
from scripts.try_backend_client import login

DEFAULT_QUESTION = "Who deleted customer records yesterday?"


def short(text, limit=200) -> str:
    """Shorten long text for printing."""
    text = str(text).replace("\n", " ")
    return text if len(text) <= limit else text[:limit] + " ..."


async def main(question: str):
    token = await login("investigator@acme.test", "Password123!")  # normally from the frontend
    agent = await build_agent(token)

    print(f"QUESTION: {question}\n")
    result = await agent.ainvoke({"messages": [{"role": "user", "content": question}]})

    # The result holds the WHOLE conversation: question, every tool call, every tool result, answer.
    for message in result["messages"]:
        if message.type == "ai" and message.tool_calls:
            for call in message.tool_calls:
                print(f"🤖 AGENT CALLS  {call['name']}({call['args']})")
        elif message.type == "tool":
            status = "❌ ERROR" if getattr(message, "status", "") == "error" else "📦 RESULT"
            print(f"   {status}    {short(message.text)}\n")

    print("=" * 80)
    print("FINAL ANSWER:\n")
    # .text gives just the words, even when the model returns a list of "content blocks".
    print(result["messages"][-1].text)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_QUESTION))
