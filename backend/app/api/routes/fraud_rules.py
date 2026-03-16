import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.fraud_rule import FraudRule
from app.schemas.fraud_rule import FraudRuleCreate, FraudRuleUpdate, FraudRuleRead
from app.services.fraud_rule_seeds import BUILTIN_RULES, SECTOR_RULES

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _get_rule_or_404(rule_id: uuid.UUID, db: AsyncSession) -> FraudRule:
    result = await db.execute(select(FraudRule).where(FraudRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Règle introuvable")
    return rule


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/fraud-rules", response_model=list[FraudRuleRead])
async def list_fraud_rules(
    category: str | None = Query(None, description="AUTONOMOUS ou CROSS_DOC"),
    sector: str | None = Query(None, description="GENERIC, BTP, SANTE, RETAIL"),
    active: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Liste toutes les règles de fraude avec filtres optionnels."""
    stmt = select(FraudRule).order_by(FraudRule.sector, FraudRule.category, FraudRule.code)
    if category:
        stmt = stmt.where(FraudRule.category == category)
    if sector:
        stmt = stmt.where(FraudRule.sector == sector)
    if active is not None:
        stmt = stmt.where(FraudRule.active == active)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/fraud-rules", response_model=FraudRuleRead, status_code=201)
async def create_fraud_rule(
    payload: FraudRuleCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crée une nouvelle règle de fraude personnalisée."""
    # Vérifier l'unicité du code
    existing = await db.execute(select(FraudRule).where(FraudRule.code == payload.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Une règle avec le code '{payload.code}' existe déjà")

    rule = FraudRule(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        condition_json=payload.condition_json,
        severity=payload.severity,
        document_types=payload.document_types,
        sector=payload.sector,
        active=payload.active,
        is_builtin=False,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.patch("/fraud-rules/{rule_id}", response_model=FraudRuleRead)
async def update_fraud_rule(
    rule_id: uuid.UUID,
    payload: FraudRuleUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Met à jour une règle (active/inactive, sévérité, description…)."""
    rule = await _get_rule_or_404(rule_id, db)

    updates: dict[str, Any] = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        return rule

    for field, value in updates.items():
        setattr(rule, field, value)

    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete("/fraud-rules/{rule_id}", status_code=204)
async def delete_fraud_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Supprime une règle. Les règles natives (is_builtin=True) ne peuvent pas être supprimées."""
    rule = await _get_rule_or_404(rule_id, db)
    if rule.is_builtin:
        raise HTTPException(
            status_code=403,
            detail="Les règles natives ne peuvent pas être supprimées. Vous pouvez les désactiver."
        )
    await db.delete(rule)
    await db.commit()


@router.post("/fraud-rules/seed/builtin", status_code=201)
async def seed_builtin_rules(db: AsyncSession = Depends(get_db)):
    """Initialise les règles natives (A1-A5, B1-B4). Idempotent — ne crée pas les doublons."""
    created = 0
    for rule_data in BUILTIN_RULES:
        existing = await db.execute(select(FraudRule).where(FraudRule.code == rule_data["code"]))
        if not existing.scalar_one_or_none():
            rule = FraudRule(**rule_data)
            db.add(rule)
            created += 1
    await db.commit()
    return {"message": f"{created} règle(s) native(s) créée(s)", "total": len(BUILTIN_RULES)}


@router.post("/fraud-rules/seed/{sector}", status_code=201)
async def seed_sector_rules(sector: str, db: AsyncSession = Depends(get_db)):
    """Importe les règles prédéfinies pour un secteur (BTP, SANTE, RETAIL)."""
    sector = sector.upper()
    rules = SECTOR_RULES.get(sector)
    if rules is None:
        raise HTTPException(status_code=404, detail=f"Secteur inconnu : {sector}. Valeurs: BTP, SANTE, RETAIL")

    created = 0
    for rule_data in rules:
        existing = await db.execute(select(FraudRule).where(FraudRule.code == rule_data["code"]))
        if not existing.scalar_one_or_none():
            rule = FraudRule(**rule_data)
            db.add(rule)
            created += 1
    await db.commit()
    return {
        "message": f"{created} règle(s) {sector} créée(s)",
        "sector": sector,
        "total_available": len(rules),
    }
