import uuid
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
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


@router.get("/documents/{doc_id}/export/pdf")
async def export_document_pdf(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Génère un rapport PDF unitaire pour un document traité."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=20 * mm, leftMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Title"], textColor=colors.HexColor("#6366F1"), alignment=TA_CENTER)
    heading_style = ParagraphStyle("heading", parent=styles["Heading2"], textColor=colors.HexColor("#6366F1"))
    story = []

    story.append(Paragraph("DocuSmart — Rapport documentaire", title_style))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(document.original_name, heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#6366F1")))
    story.append(Spacer(1, 6 * mm))

    # Métadonnées
    meta_rows = [
        ["Type", document.file_type or "—"],
        ["Statut", document.status],
        ["Créé le", str(document.created_at)[:19] if document.created_at else "—"],
        ["Traité le", str(document.processed_at)[:19] if document.processed_at else "—"],
        ["Fournisseur (SIREN)", document.supplier_siren or "—"],
        ["Confiance classification", f"{round(document.classification_confidence * 100)}%" if document.classification_confidence else "—"],
    ]
    meta_table = Table(meta_rows, colWidths=[65 * mm, 105 * mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#6366F1")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (1, 0), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(meta_table)

    # Données extraites
    if document.extracted_data and isinstance(document.extracted_data, dict):
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Données extraites par l'IA", heading_style))
        story.append(Spacer(1, 3 * mm))
        ext_rows = [["Champ", "Valeur"]]
        for key, val in document.extracted_data.items():
            if isinstance(val, dict):
                value = val.get("value", "—")
            else:
                value = val
            ext_rows.append([key.replace("_", " ").title(), str(value) if value is not None else "—"])
        ext_table = Table(ext_rows, colWidths=[65 * mm, 105 * mm])
        ext_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366F1")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ]))
        story.append(ext_table)

    doc.build(story)
    buffer.seek(0)
    filename = f"rapport_{document.original_name.rsplit('.', 1)[0]}.pdf"
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
