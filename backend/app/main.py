from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import activity_log, audit_logs, auth, health, investigations, users

# This is our whole web application. Every endpoint gets attached to `app`.
app = FastAPI(title="Audit Agent Backend")

# CORS: browsers block a page on one address (the frontend) from calling another (this API)
# unless the API says it's allowed. We allow only our own frontend(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

# Plug in each group of endpoints (one router per file in app/routes/).
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(audit_logs.router)
app.include_router(investigations.router)
app.include_router(activity_log.router)
