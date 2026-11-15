"""Hide sensitive personal data before it reaches the AI or the screen (US-14)."""

# Any key in an event's `details` with one of these names gets hidden.
SENSITIVE_FIELDS = {
    "email",
    "phone",
    "ssn",
    "card_number",
    "account_number",
    "date_of_birth",
    "password",
}

REDACTED = "[REDACTED]"


def redact_details(details: dict) -> dict:
    """Return a COPY of details with sensitive values replaced. The original is untouched."""
    return {
        key: (REDACTED if key in SENSITIVE_FIELDS else value)
        for key, value in details.items()
    }
