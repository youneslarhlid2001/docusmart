import uuid
from datetime import datetime
from sqlalchemy import String, Float, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    classification_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Statuts : UPLOADED → OCR_PROCESSING → CLASSIFYING → EXTRACTING → VERIFYING → DONE / ERROR
    status: Mapped[str] = mapped_column(String(30), default="UPLOADED", nullable=False)
    bronze_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    silver_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gold_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    extracted_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    supplier_siren: Mapped[str | None] = mapped_column(String(9), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
