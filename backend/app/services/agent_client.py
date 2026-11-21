"""Talk to the agent API (ai-agent/app/main.py): send a question, get the answer."""

import httpx

from app.core.config import settings

# One agent run may take up to 4 minutes (the agent's own limit), plus the citation check.
AGENT_TIMEOUT_SECONDS = 300


class AgentError(Exception):
    """The agent failed or couldn't be reached. The message is safe to show the user.

    status_code: what our API should answer (502 = the agent failed, 504 = it took too long).
    """

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


async def ask_agent(question: str, user_token: str) -> dict:
    """Ask the agent one question AS THE USER. Returns {answer, citations, trace, seconds}."""
    try:
        async with httpx.AsyncClient(timeout=AGENT_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{settings.agent_url}/ask",
                json={"question": question},
                headers={"Authorization": f"Bearer {user_token}"},  # the agent acts as this user
            )
    except httpx.TimeoutException:
        raise AgentError("The agent took too long. Try a narrower question.", status_code=504)
    except httpx.HTTPError:
        raise AgentError("The agent is not reachable right now. Please try again.")

    if response.status_code == 200:
        return response.json()
    if response.status_code == 504:
        raise AgentError("The agent took too long. Try a narrower question.", status_code=504)
    raise AgentError("The agent could not answer this question. Please try again.")
