import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from app.db.database import Base


class FraudRule(Base):
    __tablename__ = "fraud_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Identifiant unique de la règle ex: "TVA_ERROR", "BTP_MONTANT_MAX"
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # Catégorie : AUTONOMOUS (sans docs liés) ou CROSS_DOC (compare avec historique)
    category: Mapped[str] = mapped_column(String(20), nullable=False, default="AUTONOMOUS")
    # JSON contenant le texte d'instruction à injecter dans le prompt Gemini
    # { "type": "builtin|amount_threshold|field_format|custom", "prompt_instruction": "...", ... }
    condition_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    # Sévérité par défaut : LOW, MEDIUM, HIGH, CRITICAL
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIUM")
    # Types de documents concernés — [] = tous les types
    document_types: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    # Secteur : GENERIC, BTP, SANTE, RETAIL
    sector: Mapped[str] = mapped_column(String(50), nullable=False, default="GENERIC")
    # Règle active (injectée dans le prompt)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Règle native — ne peut pas être supprimée
    is_builtin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
