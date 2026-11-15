from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings, to_async_url

# The engine knows HOW to connect to the database.
# NullPool = don't keep connections open ourselves. Neon's pooled URL already
# does connection pooling for us, which is exactly what we want on Lambda.
engine = create_async_engine(
    to_async_url(settings.database_url),
    poolclass=NullPool,
)

# A factory that creates new sessions. A session = one unit of work with the database.
# expire_on_commit=False keeps objects readable after we save them.
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Every table (model) we create in Lesson 3 will inherit from this."""


async def get_db():
    """FastAPI dependency: gives each request its own session, then closes it."""
    async with SessionLocal() as session:
        yield session
