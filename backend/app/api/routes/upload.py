import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.document import Document
from app.schemas.document import DocumentStatusRead
from app.tasks.pipeline import process_document_pipeline

router = APIRouter()

UPLOAD_DIR = Path("/tmp/docusmart_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/upload", response_model=list[DocumentStatusRead])
async def upload_documents(
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload un ou plusieurs documents. Déclenche le pipeline de traitement IA pour chaque fichier.
    Retourne la liste des documents créés avec leur ID et statut initial.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni")

    created_docs = []

    for file in files:
        # Validation extension
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Extension non supportée : {ext}. Formats acceptés : {', '.join(ALLOWED_EXTENSIONS)}",
            )

        # Générer un nom unique pour éviter les collisions
        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}{ext}"
        file_path = UPLOAD_DIR / safe_filename

        # Sauvegarder temporairement sur disque
        try:
            with open(file_path, "wb") as f:
                content = await file.read()
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail=f"Fichier trop volumineux (max 50MB)")
                f.write(content)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde : {str(e)}")

        # Créer l'entrée en base de données
        document = Document(
            id=uuid.UUID(doc_id),
            filename=safe_filename,
            original_name=file.filename or safe_filename,
            status="UPLOADED",
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)

        # Déclencher le pipeline Celery de manière asynchrone
        process_document_pipeline.delay(doc_id, str(file_path))

        created_docs.append(document)

    return created_docs
