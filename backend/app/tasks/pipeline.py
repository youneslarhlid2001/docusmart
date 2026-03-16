import uuid
from datetime import datetime
from typing import Any
from celery import Task
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app
from app.db.database import get_sync_db, SyncSessionLocal
from app.models.document import Document
from app.models.supplier import Supplier
from app.models.alert import ComplianceAlert
from app.models.fraud_rule import FraudRule
from app.services.ocr_service import OCRService
from app.services.classification_service import ClassificationService
from app.services.extraction_service import ExtractionService
from app.services.fraud_service import FraudService
from app.services.storage_service import StorageService


def _update_status(session: Session, doc_id: str, status: str, error: str | None = None) -> None:
    """Met à jour le statut d'un document en base (synchrone)."""
    values: dict = {"status": status}
    if error:
        values["error_message"] = error
    if status == "DONE":
        values["processed_at"] = datetime.utcnow()
    session.execute(
        update(Document).where(Document.id == uuid.UUID(doc_id)).values(**values)
    )
    session.commit()


def _upsert_supplier(session: Session, siren: str, data: dict[str, Any]) -> None:
    """Crée ou met à jour le fournisseur en base."""
    result = session.execute(select(Supplier).where(Supplier.siren == siren))
    supplier = result.scalar_one_or_none()

    if supplier:
        supplier.document_count += 1
        supplier.last_document_at = datetime.utcnow()
        if data.get("raison_sociale") and not supplier.raison_sociale:
            supplier.raison_sociale = data["raison_sociale"]
        if data.get("siret") and not supplier.siret:
            supplier.siret = data["siret"]
    else:
        supplier = Supplier(
            siren=siren,
            siret=data.get("siret"),
            raison_sociale=data.get("raison_sociale"),
            document_count=1,
            last_document_at=datetime.utcnow(),
        )
        session.add(supplier)
    session.commit()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def process_document_pipeline(self: Task, doc_id: str, file_path: str) -> dict[str, Any]:
    """
    Pipeline complet de traitement d'un document (entièrement synchrone).
    Évite les conflits d'event loop entre Celery et asyncpg.

    Étapes :
    1. Bronze  → Sauvegarde fichier brut dans MinIO
    2. OCR     → Extraction texte via Google Document AI
    3. Classif → Classification via Gemini Flash
    4. Extract → Extraction champs via Gemini Flash
    5. Silver  → Données propres dans MinIO + PostgreSQL
    6. Fraud   → Détection incohérences via Gemini Pro
    7. Gold    → Données enrichies dans MinIO + PostgreSQL
    """
    storage = StorageService()
    ocr_service = OCRService()
    classification_service = ClassificationService()
    extraction_service = ExtractionService()
    fraud_service = FraudService()

    session = SyncSessionLocal()

    try:
        # ── Étape 1 : BRONZE ──────────────────────────────────────────
        _update_status(session, doc_id, "OCR_PROCESSING")

        result = session.execute(select(Document).where(Document.id == uuid.UUID(doc_id)))
        doc = result.scalar_one()
        bronze_path = storage.upload_bronze(file_path, doc_id, doc.original_name)

        session.execute(
            update(Document).where(Document.id == uuid.UUID(doc_id)).values(bronze_path=bronze_path)
        )
        session.commit()

        # ── Étape 2 : OCR ─────────────────────────────────────────────
        ocr_result = ocr_service.process_document(file_path)
        full_text = ocr_result["full_text"]
        entities = ocr_result["entities"]

        # ── Étape 3 : CLASSIFICATION ───────────────────────────────────
        _update_status(session, doc_id, "CLASSIFYING")
        classification = classification_service.classify(full_text, entities)

        # ── Étape 4 : EXTRACTION ───────────────────────────────────────
        _update_status(session, doc_id, "EXTRACTING")
        extracted_data = extraction_service.extract(full_text, classification.document_type)

        # Récupérer le SIREN extrait
        siren_field = extracted_data.get("siren")
        supplier_siren = None
        if isinstance(siren_field, dict):
            raw_siren = siren_field.get("value") or ""
            # Nettoyer le SIREN (retirer espaces et points)
            supplier_siren = raw_siren.replace(" ", "").replace(".", "")[:9] or None

        # ── Étape 5 : SILVER ──────────────────────────────────────────
        silver_payload = {
            "doc_id": doc_id,
            "document_type": classification.document_type,
            "classification_confidence": classification.confidence,
            "extracted_data": extracted_data,
            "ocr_entities": entities[:50],
        }
        silver_path = storage.upload_silver(silver_payload, doc_id)

        session.execute(
            update(Document).where(Document.id == uuid.UUID(doc_id)).values(
                file_type=classification.document_type,
                classification_confidence=classification.confidence,
                extracted_data=extracted_data,
                silver_path=silver_path,
                supplier_siren=supplier_siren,
            )
        )
        session.commit()

        if supplier_siren:
            emetteur_field = extracted_data.get("emetteur") or extracted_data.get("raison_sociale")
            raison_sociale = emetteur_field.get("value") if isinstance(emetteur_field, dict) else None
            siret_field = extracted_data.get("siret")
            siret = siret_field.get("value") if isinstance(siret_field, dict) else None
            _upsert_supplier(session, supplier_siren, {"raison_sociale": raison_sociale, "siret": siret})

        # ── Étape 6 : VÉRIFICATION / FRAUDE ───────────────────────────
        _update_status(session, doc_id, "VERIFYING")

        related_docs = []
        if supplier_siren:
            rel_result = session.execute(
                select(Document).where(
                    Document.supplier_siren == supplier_siren,
                    Document.id != uuid.UUID(doc_id),
                    Document.status == "DONE",
                ).limit(10)
            )
            related_docs = rel_result.scalars().all()

        doc_dict = {
            "file_type": classification.document_type,
            "supplier_siren": supplier_siren,
            "extracted_data": extracted_data,
        }
        related_dicts = [
            {"file_type": d.file_type, "supplier_siren": d.supplier_siren, "extracted_data": d.extracted_data or {}}
            for d in related_docs
        ]

        # Charger les règles actives depuis la BDD
        active_rules_result = session.execute(
            select(FraudRule).where(FraudRule.active == True)
        )
        active_rules = [
            {
                "code": r.code,
                "name": r.name,
                "category": r.category,
                "severity": r.severity,
                "condition_json": r.condition_json,
                "document_types": r.document_types,
            }
            for r in active_rules_result.scalars().all()
            # Filtrer par type de document si la règle est restreinte
            if not r.document_types or classification.document_type in r.document_types
        ]

        fraud_result = fraud_service.analyze(doc_dict, related_dicts, active_rules=active_rules)

        # ── Étape 7 : GOLD ────────────────────────────────────────────
        gold_payload = {
            **silver_payload,
            "fraud_analysis": {
                "has_inconsistencies": fraud_result.has_inconsistencies,
                "overall_risk": fraud_result.overall_risk,
                "reasoning": fraud_result.reasoning,
                "inconsistencies": [i.model_dump() for i in fraud_result.inconsistencies],
            },
        }
        gold_path = storage.upload_gold(gold_payload, doc_id)

        session.execute(
            update(Document).where(Document.id == uuid.UUID(doc_id)).values(
                gold_path=gold_path,
                status="DONE",
                processed_at=datetime.utcnow(),
            )
        )

        # Créer les alertes de conformité
        for item in fraud_result.inconsistencies:
            alert = ComplianceAlert(
                document_id=uuid.UUID(doc_id),
                alert_type=item.type,
                severity=item.severity,
                description=item.description,
                field_source=item.field_source,
                value_source=item.value_source,
                field_target=item.field_target,
                value_target=item.value_target,
            )
            session.add(alert)

        # Mettre à jour le score de conformité du fournisseur
        if supplier_siren and fraud_result.has_inconsistencies:
            sup_result = session.execute(select(Supplier).where(Supplier.siren == supplier_siren))
            supplier = sup_result.scalar_one_or_none()
            if supplier:
                critical = sum(1 for i in fraud_result.inconsistencies if i.severity == "CRITICAL")
                high = sum(1 for i in fraud_result.inconsistencies if i.severity == "HIGH")
                supplier.compliance_score = max(0, supplier.compliance_score - critical * 20 - high * 10)

        session.commit()
        return {"status": "DONE", "doc_id": doc_id}

    except Exception as exc:
        session.rollback()
        try:
            _update_status(session, doc_id, "ERROR", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc)
    finally:
        session.close()
