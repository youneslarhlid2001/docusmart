import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.db.database import Base


class ComplianceAlert(Base):
    __tablename__ = "compliance_alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False
    )
    document_id_2: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True
    )
    # Types : SIRET_MISMATCH, TVA_ERROR, IBAN_CONFLICT, DATE_EXPIRED, DUPLICATE_INVOICE...
    alert_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Sévérité : LOW, MEDIUM, HIGH, CRITICAL
    severity: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    field_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    value_source: Mapped[str | None] = mapped_column(String(500), nullable=True)
    field_target: Mapped[str | None] = mapped_column(String(100), nullable=True)
    value_target: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Statuts : OPEN, RESOLVED, FALSE_POSITIVE
    status: Mapped[str] = mapped_column(String(20), default="OPEN")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
