// ============================================================
// Types TypeScript partagés — DocuSmart
// ============================================================

export type DocumentStatus =
  | "UPLOADED"
  | "OCR_PROCESSING"
  | "CLASSIFYING"
  | "EXTRACTING"
  | "VERIFYING"
  | "DONE"
  | "ERROR";

export type DocumentType =
  | "FACTURE"
  | "DEVIS"
  | "ATTESTATION_URSSAF"
  | "ATTESTATION_FISCALE"
  | "BON_COMMANDE"
  | "CONTRAT"
  | "INCONNU";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "OPEN" | "RESOLVED" | "FALSE_POSITIVE";

export interface FieldWithConfidence {
  value: string | null;
  confidence: number;
}

export interface FactureExtraction {
  siren?: FieldWithConfidence;
  siret?: FieldWithConfidence;
  numero_facture?: FieldWithConfidence;
  date_emission?: FieldWithConfidence;
  date_echeance?: FieldWithConfidence;
  emetteur?: FieldWithConfidence;
  destinataire?: FieldWithConfidence;
  montant_ht?: FieldWithConfidence;
  tva_taux?: FieldWithConfidence;
  montant_tva?: FieldWithConfidence;
  montant_ttc?: FieldWithConfidence;
  numero_tva_intra?: FieldWithConfidence;
  iban?: FieldWithConfidence;
  conditions_paiement?: FieldWithConfidence;
}

export interface Document {
  id: string;
  filename: string;
  original_name: string;
  file_type: DocumentType | null;
  classification_confidence: number | null;
  status: DocumentStatus;
  bronze_path: string | null;
  silver_path: string | null;
  gold_path: string | null;
  extracted_data: Record<string, FieldWithConfidence | string | number | null> | null;
  supplier_siren: string | null;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export interface DocumentListItem {
  id: string;
  original_name: string;
  file_type: DocumentType | null;
  status: DocumentStatus;
  classification_confidence: number | null;
  supplier_siren: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface PaginatedDocuments {
  items: DocumentListItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface Supplier {
  siren: string;
  siret: string | null;
  raison_sociale: string | null;
  adresse: string | null;
  compliance_score: number;
  document_count: number;
  last_document_at: string | null;
  created_at: string;
}

export interface ComplianceAlert {
  id: string;
  document_id: string;
  document_id_2: string | null;
  alert_type: string | null;
  severity: AlertSeverity;
  description: string | null;
  field_source: string | null;
  value_source: string | null;
  field_target: string | null;
  value_target: string | null;
  status: AlertStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface DashboardStats {
  total_documents: number;
  documents_done: number;
  documents_processing: number;
  documents_error: number;
  total_alerts: number;
  open_alerts: number;
  compliance_rate: number;
  documents_by_type: Record<string, number>;
  documents_last_7_days: Array<{ date: string; count: number }>;
}

export type RuleCategory = "AUTONOMOUS" | "CROSS_DOC";
export type RuleSector = "GENERIC" | "BTP" | "SANTE" | "RETAIL";

export interface FraudRule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  condition_json: Record<string, unknown>;
  severity: AlertSeverity;
  document_types: string[];
  sector: RuleSector;
  active: boolean;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export interface FraudRuleCreate {
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  condition_json: Record<string, unknown>;
  severity: AlertSeverity;
  document_types: string[];
  sector: RuleSector;
  active: boolean;
}

export interface FraudRuleUpdate {
  name?: string;
  description?: string;
  severity?: AlertSeverity;
  condition_json?: Record<string, unknown>;
  document_types?: string[];
  active?: boolean;
}

export interface ComplianceTrendPoint {
  month: string;
  compliance_rate: number;
  documents_count: number;
  alerts_count: number;
}

export interface HeatmapCell {
  month: string;
  doc_type: string;
  count: number;
}

export interface SupplierRadarData {
  siren: string;
  name: string;
  compliance_score: number;
  doc_count: number;
  alert_count: number;
  open_alert_count: number;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface RecurringAlertSupplier {
  siren: string;
  name: string;
  open_alerts: number;
  total_alerts: number;
  last_alert_at: string | null;
}

export interface AnalyticsData {
  compliance_trend: ComplianceTrendPoint[];
  anomaly_heatmap: HeatmapCell[];
  supplier_radar: SupplierRadarData[];
  document_flow: SankeyData;
  recurring_alerts: RecurringAlertSupplier[];
}

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  documentId?: string;
  error?: string;
}
