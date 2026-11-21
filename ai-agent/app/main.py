"""The agent's web API. The backend calls POST /ask; we run the agent and return its answer.

Run it locally (with the MCP server running in another terminal):
    uv run fastapi dev --port 8001        then open http://127.0.0.1:8001/docs

The caller sends the USER's token (Authorization: Bearer ...). We never log in ourselves:
we act as that user, so the backend only shows us what that user may see.
"""

import asyncio
import time
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from langgraph.errors import GraphRecursionError
from pydantic import BaseModel, Field

from app.agent.agent import build_agent
from app.agent.answer import AuditAnswer
from app.agent.citations import CitationReport, check_citations
from app.agent.trace import build_trace
from app.tools.backend_client import BackendError, get_from_backend

MAX_STEPS = 100         # LangGraph stops the agent after this many steps (multi-step questions need ~60+)
MAX_SECONDS = 4 * 60    # we give up on a run after this long

app = FastAPI(title="Audit Agent")

# Reads "Authorization: Bearer <token>" from the request (and adds an "Authorize" button to /docs).
bearer_scheme = HTTPBearer()


# --- What comes in and what goes out -----------------------------------------

class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000, description="The user's audit question.")


class AskResponse(BaseModel):
    answer: AuditAnswer          # the agent's structured answer
    citations: CitationReport    # our code's check that every cited event really exists
    trace: list[dict]            # the tools the agent called, in order (see trace.py)
    seconds: float               # how long the run took


# --- The user's token ---------------------------------------------------------

async def user_token(credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)]) -> str:
    """Return the user's token, after checking it with the backend.

    Checking first means a bad or expired token fails right away with 401,
    instead of the agent spending LLM tokens on tool calls that all fail.
    """
    token = credentials.credentials
    try:
        await get_from_backend("/auth/me", token)
    except BackendError as error:
        if error.status_code in (401, 403):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired user token.")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(error))
    return token


UserToken = Annotated[str, Depends(user_token)]


# --- Endpoints ----------------------------------------------------------------

@app.get("/health")
async def health():
    """Used by us and by AWS to check the service is alive."""
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest, token: UserToken):
    """Run the agent on one question and return its answer when it is finished."""
    started = time.monotonic()
    agent = await build_agent(token)

    # 1. Run the agent, with a step limit and a time limit (so a run can't go on forever).
    try:
        state = await asyncio.wait_for(
            agent.ainvoke(
                {"messages": [{"role": "user", "content": body.question}]},
                config={"recursion_limit": MAX_STEPS},
            ),
            timeout=MAX_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status.HTTP_504_GATEWAY_TIMEOUT, "The agent took too long. Try a narrower question.")
    except GraphRecursionError:
        # The agent used all its steps without finishing (it kept calling tools).
        raise HTTPException(status.HTTP_504_GATEWAY_TIMEOUT, "The agent needed too many steps. Try a narrower question.")

    answer = state.get("structured_response")
    if answer is None:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The agent did not produce an answer.")

    # 2. Check the evidence with code (no AI): every cited event must really exist.
    try:
        citations = await check_citations(answer, token)
    except BackendError as error:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Could not check citations: {error}")

    return AskResponse(
        answer=answer,
        citations=citations,
        trace=build_trace(state["messages"]),
        seconds=round(time.monotonic() - started, 1),
    )
