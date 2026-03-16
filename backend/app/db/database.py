from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.config import get_settings

settings = get_settings()

# ── Moteur ASYNC — utilisé par FastAPI ────────────────────────────────────────
engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Moteur SYNC — utilisé par les workers Celery ──────────────────────────────
# Remplace asyncpg par psycopg2 pour les contextes synchrones
sync_database_url = settings.database_url.replace(
    "postgresql+asyncpg://", "postgresql+psycopg2://"
).replace("postgresql://", "postgresql+psycopg2://")

sync_engine = create_engine(
    sync_database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_db() -> Session:
    """Session synchrone pour les workers Celery."""
    return SyncSessionLocal()


async def create_tables() -> None:
    """Crée toutes les tables en base si elles n'existent pas."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
