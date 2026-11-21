# Container image for the agent. ONE image, used by TWO Lambda functions:
#   audit-agent : the agent API (POST /ask)            -> the default CMD below
#   audit-mcp   : the MCP server (the agent's tools)   -> CMD overridden in the Lambda console
# It also runs on your laptop.

FROM python:3.13-slim

# Lambda Web Adapter: lets a normal web app run on Lambda unchanged.
# On Lambda it turns Lambda events into HTTP requests. Locally it does nothing.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# uv, to install our Python packages from uv.lock.
COPY --from=ghcr.io/astral-sh/uv:0.13.0 /uv /bin/uv

WORKDIR /app

# 1. Install dependencies first (this layer is cached until pyproject/uv.lock change).
COPY pyproject.toml uv.lock ./
RUN UV_COMPILE_BYTECODE=1 uv sync --frozen --no-dev --no-install-project

# 2. Copy our code. Only app/: no .env, no scripts.
COPY app ./app

# The Lambda adapter sends requests to the app on PORT (both functions listen on 8000).
ENV PATH="/app/.venv/bin:$PATH" \
    PORT=8000

# Default: start the agent API (fastapi finds app/main.py through [tool.fastapi] in pyproject.toml).
# The audit-mcp function overrides this with: python -m app.mcp_server.server
CMD ["fastapi", "run", "--port", "8000"]
