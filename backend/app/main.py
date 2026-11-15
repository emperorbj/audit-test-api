from fastapi import FastAPI

from app.routes import activity_log, audit_logs, auth, health, investigations, users

# This is our whole web application. Every endpoint gets attached to `app`.
app = FastAPI(title="Audit Agent Backend")

# Plug in each group of endpoints (one router per file in app/routes/).
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(audit_logs.router)
app.include_router(investigations.router)
app.include_router(activity_log.router)
