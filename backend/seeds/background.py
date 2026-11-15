"""Generate normal, everyday audit events ("noise").

The planted scenarios (scenarios.py) are hidden inside this noise.
Noise rules that keep the planted scenarios unambiguous:
  1. Every background permission change has an approval, and happens 8-30 days ago.
  2. Background customer deletions happen 3-30 days ago.
  3. Admin console activity happens only during business hours (08:00-18:00 UTC).
"""

import random
from datetime import timedelta

from faker import Faker

from app.models import AuditEvent

# The company's own employees (the people who appear IN the audit logs).
# These are NOT users of our app.
EMPLOYEES = ["akosua.b", "daniel.o", "emma.w", "felix.t", "hana.s", "ivan.p",
             "joy.e", "kofi.d", "lena.r", "musa.y", "nora.f", "omar.h"]
ADMINS = ["james.k", "priya.n", "tom.b"]
APPROVERS = ["linda.m", "kwame.a"]

ROLES_THAT_CAN_BE_GRANTED = ["payments_approver", "support_agent", "finance_viewer", "crm_editor"]


def make_event_id(rng: random.Random) -> str:
    """A random-looking but repeatable ID like "evt_3f9a1c2b7d4e"."""
    return "evt_" + format(rng.getrandbits(48), "012x")


def random_time(rng, now, min_days_ago, max_days_ago, business_hours=False):
    """Pick a random moment between `max_days_ago` and `min_days_ago` before `now`."""
    days_ago = rng.uniform(min_days_ago, max_days_ago)
    moment = now - timedelta(days=days_ago)
    if business_hours:
        # Move it to a random time between 08:00 and 18:00 on that same day.
        moment = moment.replace(hour=rng.randint(8, 17), minute=rng.randint(0, 59))
        if moment > now:
            # That moved it into the future (later today). Use the day before instead.
            moment = moment - timedelta(days=1)
    return moment.replace(microsecond=0)


def make_event(rng, occurred_at, source, domain, actor, action, resource_type, resource_id,
               outcome="success", actor_role=None, description=None, details=None) -> AuditEvent:
    """Build one AuditEvent row. Every generator below uses this."""
    return AuditEvent(
        id=make_event_id(rng),
        occurred_at=occurred_at,
        source_system=source,
        domain=domain,
        actor=actor,
        actor_role=actor_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        outcome=outcome,
        description=description,
        details=details or {},
    )


# ---------------------------------------------------------------------------
# One function per domain. Each returns a list of AuditEvent rows.
# ---------------------------------------------------------------------------

def authentication_events(rng, fake, now, count):
    people = EMPLOYEES + ADMINS + APPROVERS
    events = []
    for _ in range(count):
        person = rng.choice(people)
        roll = rng.random()  # a number between 0 and 1, used to pick what happens
        if roll < 0.80:
            action, outcome, details = "login.success", "success", {"ip": fake.ipv4_public()}
        elif roll < 0.90:
            action, outcome, details = "logout", "success", {}
        else:
            action, outcome = "login.failure", "failure"
            details = {"ip": fake.ipv4_public(), "reason": "bad_password"}
        events.append(make_event(
            rng, random_time(rng, now, 0, 30), "acme-sso", "authentication", person, action,
            "account", person, outcome=outcome, details=details,
        ))
    return events


def financial_events(rng, fake, now, count):
    events = []
    for _ in range(count):
        action = rng.choice(["payment.created", "payment.approved", "refund.issued"])
        events.append(make_event(
            rng, random_time(rng, now, 0, 30, business_hours=True), "acme-payments", "financial",
            rng.choice(EMPLOYEES), action, "transaction", f"txn_{rng.randint(100000, 999999)}",
            details={
                "amount": round(rng.uniform(20, 5000), 2),
                "currency": "USD",
                "customer_account": f"acct_{rng.randint(1000, 9999)}",
            },
        ))
    return events


def customer_record_events(rng, fake, now, count):
    events = []
    for _ in range(count):
        person = rng.choice(EMPLOYEES)
        customer_id = f"cus_{rng.randint(1000, 9999)}"
        roll = rng.random()
        if roll < 0.60:
            action, when, details = "customer.viewed", random_time(rng, now, 0, 30), {}
        elif roll < 0.95:
            action = "customer.updated"
            when = random_time(rng, now, 0, 30, business_hours=True)
            # Contains personal data on purpose: we test redaction with it.
            details = {"fields_changed": ["phone", "email"],
                       "phone": fake.phone_number(), "email": fake.email()}
        else:
            # Noise rule 2: background deletions are always 3-30 days ago.
            action, when, details = "customer.deleted", random_time(rng, now, 3, 30), {}
        events.append(make_event(
            rng, when, "acme-crm", "customer_records", person, action,
            "customer", customer_id, details=details,
        ))
    return events


def permission_events_with_approvals(rng, fake, now, count):
    """Each permission change comes WITH its approval (noise rule 1)."""
    events = []
    for _ in range(count):
        ticket_id = f"CHG-{rng.randint(1000, 1999)}"
        target_person = rng.choice(EMPLOYEES)
        role = rng.choice(ROLES_THAT_CAN_BE_GRANTED)
        action = rng.choice(["role.grant", "role.grant", "role.revoke"])  # grants are more common
        change_time = random_time(rng, now, 8, 30, business_hours=True)
        approval_time = change_time - timedelta(hours=rng.randint(1, 20))  # approved BEFORE the change

        # The approval, recorded in the ticketing system
        events.append(make_event(
            rng, approval_time, "acme-ticketing", "approvals", rng.choice(APPROVERS),
            "approval.granted", "ticket", ticket_id, actor_role="manager",
            details={"ticket_id": ticket_id, "request": action,
                     "target_user": target_person, "role": role},
        ))
        # The permission change itself, recorded in the IAM system
        events.append(make_event(
            rng, change_time, "acme-iam", "permissions", rng.choice(ADMINS), action,
            "user", target_person, actor_role="admin",
            details={"role": role, "ticket_id": ticket_id},
        ))
    return events


def admin_events(rng, fake, now, count):
    events = []
    for _ in range(count):
        action = rng.choice(["settings.updated", "api_key.created", "user.invited"])
        # Noise rule 3: admin console activity only in business hours.
        events.append(make_event(
            rng, random_time(rng, now, 0, 30, business_hours=True), "acme-admin-console", "admin",
            rng.choice(ADMINS), action,
            "setting" if action == "settings.updated" else "account",
            f"res_{rng.randint(100, 999)}", actor_role="admin",
        ))
    return events


def generate_background_events(now, total=1500):
    """All the noise, split across the domains. Same seed -> identical output every run."""
    rng = random.Random(42)
    fake = Faker()
    fake.seed_instance(42)

    events = []
    events += authentication_events(rng, fake, now, int(total * 0.45))
    events += financial_events(rng, fake, now, int(total * 0.20))
    events += customer_record_events(rng, fake, now, int(total * 0.20))
    events += permission_events_with_approvals(rng, fake, now, int(total * 0.05))
    events += admin_events(rng, fake, now, int(total * 0.05))
    return events
