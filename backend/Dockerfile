# Container image for the backend. Runs on AWS Lambda AND on your laptop.

FROM python:3.13-slim

# Lambda Web Adapter: lets a normal web app (our FastAPI) run on Lambda unchanged.
# On Lambda it turns Lambda events into HTTP requests. Locally it does nothing.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# uv, to install our Python packages from uv.lock.
COPY --from=ghcr.io/astral-sh/uv:0.13.0 /uv /bin/uv

WORKDIR /app

# 1. Install dependencies first (this layer is cached until pyproject/uv.lock change).
#    --frozen: use uv.lock exactly.  --no-dev: skip dev tools like faker.
COPY pyproject.toml uv.lock ./
RUN UV_COMPILE_BYTECODE=1 uv sync --frozen --no-dev --no-install-project

# 2. Copy our code. Only app/: no .env, no seeds, no tests.
COPY app ./app

# The Lambda adapter waits until the app answers on PORT before sending requests.
# (Its default check doesn't touch the database, so a DB problem shows up as a clear
# error from /health instead of the whole app looking dead.)
ENV PATH="/app/.venv/bin:$PATH" \
    PORT=8000

# Start the API (fastapi finds app/main.py through [tool.fastapi] in pyproject.toml).
CMD ["fastapi", "run", "--port", "8000"]
