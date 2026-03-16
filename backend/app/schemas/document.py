import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    original_name: str
    file_type: str | None = None
    status: str = "UPLOADED"


class DocumentCreate(DocumentBase):
    filename: str


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    original_name: str
    file_type: str | None
    classification_confidence: float | None
    status: str
    bronze_path: str | None
    silver_path: str | None
    gold_path: str | None
    extracted_data: dict[str, Any] | None
    supplier_siren: str | None
    created_at: datetime
    processed_at: datetime | None
    error_message: str | None


class DocumentStatusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    error_message: str | None


class DocumentListRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    original_name: str
    file_type: str | None
    status: str
    classification_confidence: float | None
    supplier_siren: str | None
    created_at: datetime
    processed_at: datetime | None


class PaginatedDocuments(BaseModel):
    items: list[DocumentListRead]
    total: int
    page: int
    per_page: int
    pages: int
