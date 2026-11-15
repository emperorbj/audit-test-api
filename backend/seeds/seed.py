"""Fill the database with test data.

Run it with:   uv run python -m seeds.seed

WARNING: this DELETES all existing rows first, then inserts fresh data.
Only run it against a development/test database, never production.
"""

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import delete

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    ROLE_INVESTIGATOR,
    ROLE_ORG_ADMIN,
    ROLE_VIEWER,
    ActivityLog,
    AuditEvent,
    Investigation,
    Message,
    User,
)
from seeds.background import generate_background_events
from seeds.scenarios import generate_planted_scenarios

# The answer key for the agent's tests is written here (next to this file).
EXPECTED_ANSWERS_FILE = Path(__file__).parent / "expected_answers.json"

# Every test user gets this password. Fine for test data, never for real users.
TEST_PASSWORD = "Password123!"

# One user per role. IDs are fixed so tests can rely on them.
USERS = [
    {"id": "usr_admin", "name": "Ada Mensah", "email": "admin@acme.test", "role": ROLE_ORG_ADMIN},
    {"id": "usr_investigator", "name": "Amara Osei", "email": "investigator@acme.test", "role": ROLE_INVESTIGATOR},
    {"id": "usr_viewer", "name": "Victor Lin", "email": "viewer@acme.test", "role": ROLE_VIEWER},
]


async def clear_all_tables(db):
    """Delete every row. Children first, parents last (because of foreign keys)."""
    for model in [ActivityLog, Message, Investigation, AuditEvent, User]:
        await db.execute(delete(model))


async def seed_users(db):
    for user in USERS:
        db.add(User(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            password_hash=hash_password(TEST_PASSWORD),  # each user gets their own hash
        ))


async def seed_audit_events(db, now):
    """Background noise + planted scenarios. Returns (event count, expected answers)."""
    background = generate_background_events(now, total=1500)
    planted, expected_answers = generate_planted_scenarios(now, background)
    db.add_all(background + planted)
    return len(background) + len(planted), expected_answers


def write_expected_answers(now, expected_answers):
    """Save the answer key as JSON so the agent's tests can read it."""
    data = {
        "seeded_at_utc": now.isoformat(),
        "note": "Times are relative to seeded_at_utc. Re-seed before running agent tests.",
        "scenarios": expected_answers,
    }
    EXPECTED_ANSWERS_FILE.write_text(json.dumps(data, indent=2))


async def main():
    # All event times are calculated backwards from this moment (rounded to the hour).
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    async with SessionLocal() as db:
        print("Clearing old data...")
        await clear_all_tables(db)

        print("Adding users...")
        await seed_users(db)

        print("Adding audit events (background noise + planted scenarios)...")
        event_count, expected_answers = await seed_audit_events(db, now)

        # Nothing is saved until commit. If anything above failed, nothing is saved.
        await db.commit()

    write_expected_answers(now, expected_answers)
    print(f"Answer key written to {EXPECTED_ANSWERS_FILE.name} ({len(expected_answers)} scenarios).")
    print(f"Done. {len(USERS)} users, {event_count} audit events.")
    print(f"Log in with any test email and password: {TEST_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
