from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All settings for the backend.

    Each field is read from an environment variable with the same name
    (for example DATABASE_URL). Locally they come from the .env file.
    If a required one is missing, the app refuses to start with a clear error.
    """

    database_url: str                      # Neon pooled URL, used by the app
    database_url_direct: str | None = None # Neon direct URL, only for migrations (laptop). Not needed on Lambda.

    jwt_secret: str                  # secret key that signs login tokens
    jwt_expire_minutes: int = 60     # how long a login token stays valid (has a default)

    # hide_input_in_errors: if a setting is missing or wrong, the error message must NOT
    # print the other values (they are secrets, and errors end up in logs).
    model_config = SettingsConfigDict(env_file=".env", hide_input_in_errors=True)


def to_async_url(url: str) -> str:
    """Neon gives URLs starting with "postgresql://".
    SQLAlchemy needs "postgresql+psycopg://" to know which driver to use.
    """
    return url.replace("postgresql://", "postgresql+psycopg://", 1)


# One shared settings object. Import it anywhere: `from app.core.config import settings`
settings = Settings()
