import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, field_validator


VALID_CATEGORIES = {"AUTONOMOUS", "CROSS_DOC"}
VALID_SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
VALID_SECTORS = {"GENERIC", "BTP", "SANTE", "RETAIL"}
VALID_DOC_TYPES = {
    "FACTURE", "DEVIS", "ATTESTATION_URSSAF",
    "ATTESTATION_FISCALE", "BON_COMMANDE", "CONTRAT", "INCONNU",
}


class FraudRuleCreate(BaseModel):
    code: str
    name: str
    description: str
    category: str = "AUTONOMOUS"
    condition_json: dict[str, Any] = {}
    severity: str = "MEDIUM"
    document_types: list[str] = []
    sector: str = "GENERIC"
    active: bool = True

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category doit être parmi {VALID_CATEGORIES}")
        return v

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str) -> str:
        if v not in VALID_SEVERITIES:
            raise ValueError(f"severity doit être parmi {VALID_SEVERITIES}")
        return v

    @field_validator("sector")
    @classmethod
    def validate_sector(cls, v: str) -> str:
        if v not in VALID_SECTORS:
            raise ValueError(f"sector doit être parmi {VALID_SECTORS}")
        return v


class FraudRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    severity: str | None = None
    condition_json: dict[str, Any] | None = None
    document_types: list[str] | None = None
    active: bool | None = None

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_SEVERITIES:
            raise ValueError(f"severity doit être parmi {VALID_SEVERITIES}")
        return v


class FraudRuleRead(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: str
    category: str
    condition_json: dict[str, Any]
    severity: str
    document_types: list[str]
    sector: str
    active: bool
    is_builtin: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
