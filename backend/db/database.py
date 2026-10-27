"""Database connection and session management using SQLAlchemy 2.0 and aiosqlite."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from core.config import settings

# Configure SQLite connection arguments if sqlite engine is used
connect_args = {"check_same_thread": False} if "sqlite" in settings.DB_URL else {}

engine = create_async_engine(
    settings.DB_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for yielding database session instances."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables using metadata."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
