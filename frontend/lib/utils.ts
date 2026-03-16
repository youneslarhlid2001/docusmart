import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DocumentStatus, DocumentType, AlertSeverity } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  UPLOADED: "Uploadé",
  OCR_PROCESSING: "OCR en cours",
  CLASSIFYING: "Classification",
  EXTRACTING: "Extraction",
  VERIFYING: "Vérification",
  DONE: "Traité",
  ERROR: "Erreur",
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  UPLOADED: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  OCR_PROCESSING: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  CLASSIFYING: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  EXTRACTING: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  VERIFYING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  DONE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  ERROR: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const TYPE_LABELS: Record<string, string> = {
  FACTURE: "Facture",
  DEVIS: "Devis",
  ATTESTATION_URSSAF: "Attestation URSSAF",
  ATTESTATION_FISCALE: "Attestation Fiscale",
  BON_COMMANDE: "Bon de Commande",
  CONTRAT: "Contrat",
  INCONNU: "Inconnu",
};

export const TYPE_COLORS: Record<string, string> = {
  FACTURE: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  DEVIS: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  ATTESTATION_URSSAF: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  ATTESTATION_FISCALE: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  BON_COMMANDE: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  CONTRAT: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  INCONNU: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  LOW: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  CRITICAL: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  LOW: "Faible",
  MEDIUM: "Moyen",
  HIGH: "Élevé",
  CRITICAL: "Critique",
};

export function isProcessingStatus(status: DocumentStatus): boolean {
  return ["UPLOADED", "OCR_PROCESSING", "CLASSIFYING", "EXTRACTING", "VERIFYING"].includes(status);
}
