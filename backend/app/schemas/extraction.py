from typing import Any
from pydantic import BaseModel


class FieldWithConfidence(BaseModel):
    """Valeur extraite avec score de confiance OCR/IA."""
    value: str | None = None
    confidence: float = 0.0


class FactureExtraction(BaseModel):
    siren: FieldWithConfidence | None = None
    siret: FieldWithConfidence | None = None
    numero_facture: FieldWithConfidence | None = None
    date_emission: FieldWithConfidence | None = None
    date_echeance: FieldWithConfidence | None = None
    emetteur: FieldWithConfidence | None = None
    destinataire: FieldWithConfidence | None = None
    montant_ht: FieldWithConfidence | None = None
    tva_taux: FieldWithConfidence | None = None
    montant_tva: FieldWithConfidence | None = None
    montant_ttc: FieldWithConfidence | None = None
    numero_tva_intra: FieldWithConfidence | None = None
    iban: FieldWithConfidence | None = None
    conditions_paiement: FieldWithConfidence | None = None


class DevisExtraction(BaseModel):
    siren: FieldWithConfidence | None = None
    siret: FieldWithConfidence | None = None
    numero_devis: FieldWithConfidence | None = None
    date_devis: FieldWithConfidence | None = None
    validite: FieldWithConfidence | None = None
    emetteur: FieldWithConfidence | None = None
    destinataire: FieldWithConfidence | None = None
    montant_ht: FieldWithConfidence | None = None
    montant_ttc: FieldWithConfidence | None = None
    postes: list[dict[str, Any]] = []


class AttestationExtraction(BaseModel):
    type_attestation: FieldWithConfidence | None = None
    siren: FieldWithConfidence | None = None
    siret: FieldWithConfidence | None = None
    raison_sociale: FieldWithConfidence | None = None
    periode_validite: FieldWithConfidence | None = None
    date_emission: FieldWithConfidence | None = None
    organisme_emetteur: FieldWithConfidence | None = None
    statut: FieldWithConfidence | None = None


class ClassificationResult(BaseModel):
    document_type: str
    confidence: float
    justification: str
