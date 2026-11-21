"""All settings for the agent, read from environment variables (locally: the .env file)."""

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Each field is read from the environment variable with the same name, in capitals
    (for example `backend_url` <- BACKEND_URL). Missing required ones stop the app at startup.
    """

    # --- The agent runs on Claude ---
    # Optional here because the MCP server (same code, its own Lambda) doesn't need it.
    # The agent checks it's set when it starts a run (see make_model in agent.py).
    anthropic_api_key: SecretStr | None = None  # SecretStr: printing it shows ********** instead of the key
    anthropic_model: str = "claude-opus-5-5"    # has a default; set ANTHROPIC_MODEL to change it

    # --- Where our tools send their requests ---
    backend_url: str            # the backend's base URL, without a trailing slash

    # --- Where the agent finds its tools (our MCP server). Has a default for local use. ---
    mcp_server_url: str = "http://127.0.0.1:8002/mcp"

    # --- Where the MCP server itself listens ---
    # Locally: 127.0.0.1 = only this laptop can reach it.
    # On Lambda set MCP_HOST=0.0.0.0 so requests arriving through the Function URL get in.
    mcp_host: str = "127.0.0.1"
    mcp_port: int = 8002

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",               # other variables in .env are allowed and ignored
        hide_input_in_errors=True,    # errors never print values (they may be secrets)
    )


# One shared settings object. Import it anywhere: `from app.core.config import settings`
settings = Settings()
