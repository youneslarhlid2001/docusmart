import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.document import Document
from app.tasks.pipeline import process_document_pipeline
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("/tmp/docusmart_uploads")


@router.post("/documents/{doc_id}/reprocess")
async def reprocess_document(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Relance le pipeline de traitement pour un document (utile en cas d'erreur)."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    file_path = UPLOAD_DIR / document.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier source introuvable sur disque")

    process_document_pipeline.delay(str(doc_id), str(file_path))
    return {"message": "Retraitement lancé", "doc_id": str(doc_id)}
