from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.supplier import Supplier
from app.models.document import Document
from app.schemas.fraud import SupplierRead
from app.schemas.document import DocumentListRead

router = APIRouter()


@router.get("/suppliers", response_model=list[SupplierRead])
async def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Liste tous les fournisseurs connus, triés par score de conformité."""
    result = await db.execute(
        select(Supplier)
        .order_by(Supplier.compliance_score.asc())  # Les moins conformes en premier
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/suppliers/{siren}", response_model=SupplierRead)
async def get_supplier(siren: str, db: AsyncSession = Depends(get_db)):
    """Détail d'un fournisseur par son SIREN."""
    result = await db.execute(select(Supplier).where(Supplier.siren == siren))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    return supplier


@router.get("/suppliers/{siren}/documents", response_model=list[DocumentListRead])
async def get_supplier_documents(
    siren: str,
    db: AsyncSession = Depends(get_db),
):
    """Liste tous les documents d'un fournisseur donné."""
    result = await db.execute(
        select(Document)
        .where(Document.supplier_siren == siren)
        .order_by(Document.created_at.desc())
    )
    return result.scalars().all()
