import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class InconsistencyItem(BaseModel):
    """Une incohérence détectée entre documents."""
    type: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    field_source: str | None = None
    value_source: str | None = None
    field_target: str | None = None
    value_target: str | None = None


class FraudAnalysisResult(BaseModel):
    has_inconsistencies: bool
    inconsistencies: list[InconsistencyItem]
    overall_risk: str  # LOW, MEDIUM, HIGH, CRITICAL
    reasoning: str


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    document_id_2: uuid.UUID | None
    alert_type: str | None
    severity: str
    description: str | None
    field_source: str | None
    value_source: str | None
    field_target: str | None
    value_target: str | None
    status: str
    created_at: datetime
    resolved_at: datetime | None


class AlertUpdateRequest(BaseModel):
    status: str  # RESOLVED, FALSE_POSITIVE


class SupplierRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    siren: str
    siret: str | None
    raison_sociale: str | None
    adresse: str | None
    compliance_score: float
    document_count: int
    last_document_at: datetime | None
    created_at: datetime


class StatsRead(BaseModel):
    total_documents: int
    documents_done: int
    documents_processing: int
    documents_error: int
    total_alerts: int
    open_alerts: int
    compliance_rate: float
    documents_by_type: dict[str, int]
    documents_last_7_days: list[dict]


class ComplianceTrendPoint(BaseModel):
    month: str
    compliance_rate: float
    documents_count: int
    alerts_count: int


class HeatmapCell(BaseModel):
    month: str
    doc_type: str
    count: int


class SupplierRadarData(BaseModel):
    siren: str
    name: str
    compliance_score: float
    doc_count: int
    alert_count: int
    open_alert_count: int


class SankeyNode(BaseModel):
    name: str


class SankeyLink(BaseModel):
    source: int
    target: int
    value: int


class SankeyData(BaseModel):
    nodes: list[SankeyNode]
    links: list[SankeyLink]


class RecurringAlertSupplier(BaseModel):
    siren: str
    name: str
    open_alerts: int
    total_alerts: int
    last_alert_at: datetime | None


class AnalyticsRead(BaseModel):
    compliance_trend: list[ComplianceTrendPoint]
    anomaly_heatmap: list[HeatmapCell]
    supplier_radar: list[SupplierRadarData]
    document_flow: SankeyData
    recurring_alerts: list[RecurringAlertSupplier]
