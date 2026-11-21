"""Talk to our backend API. Every tool uses `get_from_backend` to fetch audit data."""

import httpx

from app.core.config import settings


class BackendError(Exception):
    """The backend said no (or couldn't be reached). The message is safe to show the LLM.

    status_code: the HTTP status (e.g. 404 = not found), or None if the backend wasn't reached.
    """

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


async def get_from_backend(path: str, token: str, params: dict | None = None) -> dict:
    """GET `path` from the backend AS THE USER (with their token) and return the JSON.

    Example: await get_from_backend("/audit-logs", token, {"action": "customer.deleted"})
    """
    # Leave out filters that weren't given, e.g. {"actor": None} -> {}
    clean_params = {key: value for key, value in (params or {}).items() if value is not None}

    try:
        async with httpx.AsyncClient(base_url=settings.backend_url, timeout=30.0) as client:
            response = await client.get(
                path,
                params=clean_params,
                headers={"Authorization": f"Bearer {token}"},  # act as the user
            )
    except httpx.HTTPError as exc:
        raise BackendError(f"Could not reach the backend ({exc.__class__.__name__}).") from exc

    if response.status_code == 200:
        return response.json()

    # Not OK: pass the backend's own explanation on (e.g. "Time range too long...").
    try:
        detail = response.json().get("detail", response.text)
    except ValueError:
        detail = response.text
    raise BackendError(f"Backend returned {response.status_code}: {detail}", status_code=response.status_code)
