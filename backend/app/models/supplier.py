from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    siren: Mapped[str] = mapped_column(String(9), primary_key=True)
    siret: Mapped[str | None] = mapped_column(String(14), nullable=True)
    raison_sociale: Mapped[str | None] = mapped_column(String(255), nullable=True)
    adresse: Mapped[str | None] = mapped_column(String(500), nullable=True)
    compliance_score: Mapped[float] = mapped_column(Float, default=100.0)
    document_count: Mapped[int] = mapped_column(Integer, default=0)
    last_document_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
