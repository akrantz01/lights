from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator

from lights_common import SETTINGS


engine = create_async_engine(SETTINGS.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(
    engine,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
    class_=AsyncSession,
    future=True,
)


async def with_db() -> AsyncGenerator:
    """
    Open a new session to the database
    :return: an async database session
    """
    try:
        async with SessionLocal() as session:
            yield session
    finally:
        await session.close()
