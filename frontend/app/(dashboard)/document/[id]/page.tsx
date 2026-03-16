"use client";
import { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, ExternalLink, Clock, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExtractionPanel } from "@/components/documents/ExtractionPanel";
import { FraudAlert } from "@/components/documents/FraudAlert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useDocument } from "@/hooks/useDocuments";
import { useUpdateAlert, useAlerts } from "@/hooks/useDocuments";
import { formatDate, STATUS_LABELS, STATUS_COLORS, TYPE_LABELS, isProcessingStatus } from "@/lib/utils";
import type { FieldWithConfidence } from "@/lib/types";

// Champs d'extraction pour les factures
const FACTURE_FIELDS = [
  { key: "emetteur", label: "Émetteur" },
  { key: "destinataire", label: "Destinataire" },
  { key: "siren", label: "SIREN", mono: true },
  { key: "siret", label: "SIRET", mono: true },
  { key: "numero_facture", label: "N° Facture", mono: true },
  { key: "date_emission", label: "Date émission", mono: true },
  { key: "date_echeance", label: "Date échéance", mono: true },
  { key: "montant_ht", label: "Montant HT", mono: true },
  { key: "tva_taux", label: "Taux TVA (%)", mono: true },
  { key: "montant_tva", label: "Montant TVA", mono: true },
  { key: "montant_ttc", label: "Montant TTC", mono: true },
  { key: "numero_tva_intra", label: "TVA Intra", mono: true },
  { key: "iban", label: "IBAN", mono: true },
  { key: "conditions_paiement", label: "Conditions paiement" },
];

const DEVIS_FIELDS = [
  { key: "emetteur", label: "Émetteur" },
  { key: "destinataire", label: "Destinataire" },
  { key: "siren", label: "SIREN", mono: true },
  { key: "numero_devis", label: "N° Devis", mono: true },
  { key: "date_devis", label: "Date devis", mono: true },
  { key: "validite", label: "Validité" },
  { key: "montant_ht", label: "Montant HT", mono: true },
  { key: "montant_ttc", label: "Montant TTC", mono: true },
];

const ATTESTATION_FIELDS = [
  { key: "raison_sociale", label: "Raison sociale" },
  { key: "siren", label: "SIREN", mono: true },
  { key: "siret", label: "SIRET", mono: true },
  { key: "organisme_emetteur", label: "Organisme émetteur" },
  { key: "date_emission", label: "Date émission", mono: true },
  { key: "periode_validite", label: "Période validité" },
  { key: "statut", label: "Statut" },
];

function getFieldsForType(type: string | null) {
  if (type === "FACTURE") return FACTURE_FIELDS;
  if (type === "DEVIS") return DEVIS_FIELDS;
  if (type?.startsWith("ATTESTATION")) return ATTESTATION_FIELDS;
  return FACTURE_FIELDS;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: document, isLoading, refetch } = useDocument(id);
  const { data: docAlerts = [] } = useAlerts({ document_id: id });
  const updateAlert = useUpdateAlert();

  if (isLoading || !document) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const fields = getFieldsForType(document.file_type);
  const extractedData = document.extracted_data as Record<string, FieldWithConfidence> | null;
  const fieldData = fields.map((f) => ({
    ...f,
    value: extractedData?.[f.key] as FieldWithConfidence | null | undefined,
  }));

  const isProcessing = isProcessingStatus(document.status);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[Syne] truncate max-w-xl">
              {document.original_name}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {document.file_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {TYPE_LABELS[document.file_type] || document.file_type}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[document.status]} ${isProcessing ? "status-processing" : ""}`}>
                {isProcessing && <Clock className="w-3 h-3 inline mr-1" />}
                {STATUS_LABELS[document.status]}
              </span>
              {docAlerts.some((a) => a.status === "OPEN") && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
                  <ShieldAlert className="w-3 h-3" />
                  {docAlerts.filter((a) => a.status === "OPEN").length} fraude(s) détectée(s)
                </span>
              )}
              {document.supplier_siren && (
                <span className="text-xs text-[var(--text-secondary)] font-[JetBrains_Mono]">
                  SIREN: {document.supplier_siren}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
      </motion.div>

      {/* Processing state */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 border border-indigo-500/30 flex items-center gap-3"
        >
          <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
          <p className="text-indigo-300 text-sm">
            Pipeline en cours : {STATUS_LABELS[document.status]}...
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Métadonnées */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Fichier</span>
                <span className="text-[var(--text-primary)] font-[JetBrains_Mono] text-xs">{document.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Créé le</span>
                <span className="text-[var(--text-primary)]">{formatDate(document.created_at)}</span>
              </div>
              {document.processed_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Traité le</span>
                  <span className="text-[var(--text-primary)]">{formatDate(document.processed_at)}</span>
                </div>
              )}
              {document.classification_confidence && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Confiance classification</span>
                  <span className="text-emerald-400 font-[JetBrains_Mono]">
                    {Math.round(document.classification_confidence * 100)}%
                  </span>
                </div>
              )}
              {document.bronze_path && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Zone Bronze</span>
                  <span className="text-xs text-[var(--text-secondary)] font-[JetBrains_Mono] truncate max-w-[200px]">{document.bronze_path}</span>
                </div>
              )}
              {document.error_message && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {document.error_message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Extraction */}
        {extractedData && Object.keys(extractedData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Extraction IA</CardTitle>
            </CardHeader>
            <CardContent>
              <ExtractionPanel fields={fieldData} />
            </CardContent>
          </Card>
        )}

        {/* Alertes de conformité */}
        {docAlerts.length > 0 && (
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Incohérences détectées</CardTitle>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  {docAlerts.length} alerte(s)
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {docAlerts.map((alert) => (
                    <FraudAlert
                      key={alert.id}
                      alert={alert}
                      onResolve={(id) => updateAlert.mutate({ id, status: "RESOLVED" })}
                      onFalsePositive={(id) => updateAlert.mutate({ id, status: "FALSE_POSITIVE" })}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
