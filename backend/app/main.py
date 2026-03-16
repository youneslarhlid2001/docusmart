from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db.database import create_tables
from app.api.routes import documents, upload, processing, suppliers, compliance, fraud_rules

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    # Seed des règles natives au démarrage si la table est vide
    from app.db.database import AsyncSessionLocal
    from sqlalchemy import select, func
    from app.models.fraud_rule import FraudRule
    from app.services.fraud_rule_seeds import BUILTIN_RULES
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(func.count()).select_from(FraudRule))
        count = result.scalar()
        if count == 0:
            for rule_data in BUILTIN_RULES:
                session.add(FraudRule(**rule_data))
            await session.commit()
    yield


app = FastAPI(
    title="DocuSmart API",
    description="API de traitement automatique de documents administratifs",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(documents.router, prefix="/api", tags=["documents"])
app.include_router(processing.router, prefix="/api", tags=["processing"])
app.include_router(suppliers.router, prefix="/api", tags=["suppliers"])
app.include_router(compliance.router, prefix="/api", tags=["compliance"])
app.include_router(fraud_rules.router, prefix="/api", tags=["fraud-rules"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.environment}
