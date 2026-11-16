"""Try the backend client by hand (no AI involved).

Run from the ai-agent folder:   uv run python -m scripts.try_backend_client

It logs in as the test investigator (like the frontend would), then uses
get_from_backend() exactly like our tools will.
"""

import asyncio

import httpx

from app.core.config import settings
from app.tools.backend_client import BackendError, get_from_backend


async def login(email: str, password: str) -> str:
    """Get a token, the way the frontend does. (The agent itself never logs in.)"""
    async with httpx.AsyncClient(base_url=settings.backend_url, timeout=30.0) as client:
        response = await client.post("/auth/login", json={"email": email, "password": password})
    response.raise_for_status()
    return response.json()["access_token"]


async def main():
    token = await login("investigator@acme.test", "Password123!")
    print("1) Logged in, got a token.\n")

    # A normal search: the 3 most recent customer deletions in the last 31 days.
    page = await get_from_backend("/audit-logs", token, {
        "action": "customer.deleted",
        "limit": 3,
        "actor": None,  # not given -> left out of the request
    })
    print(f"2) Search worked. {page['count']} events (more available: {page['truncated']}). Note: {page['note']}")
    for event in page["events"]:
        print(f"   {event['occurred_at']}  {event['actor']:8}  {event['action']}  {event['event_id']}")

    # An error on purpose: a 2-month range. The backend refuses with a clear message.
    print("\n3) Asking for a 2-month range on purpose...")
    try:
        await get_from_backend("/audit-logs", token, {"start": "2026-01-01T00:00:00Z", "end": "2026-03-01T00:00:00Z"})
    except BackendError as error:
        print(f"   BackendError: {error}")

    # Another error on purpose: a fake token.
    print("\n4) Using a fake token on purpose...")
    try:
        await get_from_backend("/audit-logs", "not-a-real-token")
    except BackendError as error:
        print(f"   BackendError: {error}")


if __name__ == "__main__":
    asyncio.run(main())
