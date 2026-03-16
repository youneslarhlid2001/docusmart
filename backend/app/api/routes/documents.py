import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.document import Document
from app.schemas.document import DocumentRead, DocumentStatusRead, PaginatedDocuments, DocumentListRead

router = APIRouter()


@router.get("/documents", response_model=PaginatedDocuments)
async def list_documents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = None,
    file_type: str | None = None,
    supplier_siren: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Liste paginée des documents avec filtres optionnels."""
    query = select(Document).order_by(Document.created_at.desc())

    if status:
        query = query.where(Document.status == status)
    if file_type:
        query = query.where(Document.file_type == file_type)
    if supplier_siren:
        query = query.where(Document.supplier_siren == supplier_siren)

    # Compter le total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Pagination
    offset = (page - 1) * per_page
    paginated_query = query.offset(offset).limit(per_page)
    result = await db.execute(paginated_query)
    documents = result.scalars().all()

    pages = (total + per_page - 1) // per_page if total > 0 else 1

    return PaginatedDocuments(
        items=[DocumentListRead.model_validate(d) for d in documents],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.get("/documents/{doc_id}", response_model=DocumentRead)
async def get_document(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Récupère le détail complet d'un document avec ses données extraites."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    return DocumentRead.model_validate(document)


@router.get("/documents/{doc_id}/status", response_model=DocumentStatusRead)
async def get_document_status(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Polling du statut du pipeline de traitement (pour le frontend temps réel)."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    return DocumentStatusRead.model_validate(document)


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Supprime un document de la base de données."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    await db.delete(document)
    await db.commit()
