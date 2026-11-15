import uuid


def new_id(prefix: str) -> str:
    """Make a readable unique ID, for example new_id("usr") -> "usr_3f9a1c2b7d4e"."""
    return f"{prefix}_{uuid.uuid4().hex[:12]}"
