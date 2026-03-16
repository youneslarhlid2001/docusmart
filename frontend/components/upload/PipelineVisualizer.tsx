"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ScanText,
  Tags,
  FileSearch,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useDocumentStatus } from "@/hooks/useDocuments";
import type { DocumentStatus } from "@/lib/types";

// ── Palettes de couleurs statiques (Tailwind ne peut pas purger les classes dynamiques) ──

type StepColor = "indigo" | "violet" | "cyan" | "teal" | "amber" | "emerald";

const COLOR_MAP: Record<
  StepColor,
  {
    ring: string;
    icon: string;
    label: string;
    bg: string;
    border: string;
    badge: string;
    title: string;
    pulse: string;
    shadow: string;
  }
> = {
  indigo: {
    ring: "border-indigo-400",
    icon: "text-indigo-400",
    label: "text-indigo-300",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/20",
    badge: "bg-indigo-500/20 text-indigo-300",
    title: "text-indigo-300",
    pulse: "bg-indigo-500/30",
    shadow: "shadow-indigo-500/20",
  },
  violet: {
    ring: "border-violet-400",
    icon: "text-violet-400",
    label: "text-violet-300",
    bg: "bg-violet-500/15",
    border: "border-violet-500/20",
    badge: "bg-violet-500/20 text-violet-300",
    title: "text-violet-300",
    pulse: "bg-violet-500/30",
    shadow: "shadow-violet-500/20",
  },
  cyan: {
    ring: "border-cyan-400",
    icon: "text-cyan-400",
    label: "text-cyan-300",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/20",
    badge: "bg-cyan-500/20 text-cyan-300",
    title: "text-cyan-300",
    pulse: "bg-cyan-500/30",
    shadow: "shadow-cyan-500/20",
  },
  teal: {
    ring: "border-teal-400",
    icon: "text-teal-400",
    label: "text-teal-300",
    bg: "bg-teal-500/15",
    border: "border-teal-500/20",
    badge: "bg-teal-500/20 text-teal-300",
    title: "text-teal-300",
    pulse: "bg-teal-500/30",
    shadow: "shadow-teal-500/20",
  },
  amber: {
    ring: "border-amber-400",
    icon: "text-amber-400",
    label: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-300",
    title: "text-amber-300",
    pulse: "bg-amber-500/30",
    shadow: "shadow-amber-500/20",
  },
  emerald: {
    ring: "border-emerald-400",
    icon: "text-emerald-400",
    label: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-300",
    title: "text-emerald-300",
    pulse: "bg-emerald-500/30",
    shadow: "shadow-emerald-500/20",
  },
};

// ── Définition du pipeline ─────────────────────────────────────────────────

interface PipelineStep {
  id: string;
  label: string;
  icon: React.ElementType;
  activeStatus: DocumentStatus[];
  doneAfter: DocumentStatus[];
  description: string;
  detail: string;
  color: StepColor;
}

const STEPS: PipelineStep[] = [
  {
    id: "upload",
    label: "Réception",
    icon: Upload,
    activeStatus: ["UPLOADED"],
    doneAfter: ["OCR_PROCESSING", "CLASSIFYING", "EXTRACTING", "VERIFYING", "DONE"],
    description: "Fichier sécurisé",
    detail:
      "Le fichier original est stocké dans MinIO (couche Bronze). Un identifiant unique lui est attribué et la tâche de traitement est envoyée à Celery.",
    color: "indigo",
  },
  {
    id: "ocr",
    label: "OCR",
    icon: ScanText,
    activeStatus: ["OCR_PROCESSING"],
    doneAfter: ["CLASSIFYING", "EXTRACTING", "VERIFYING", "DONE"],
    description: "Extraction du texte",
    detail:
      "Google Document AI analyse le fichier PDF ou image. Il extrait le texte brut, les entités (montants, dates, noms) et la structure de chaque page via des modèles de vision entraînés.",
    color: "violet",
  },
  {
    id: "classify",
    label: "Classification",
    icon: Tags,
    activeStatus: ["CLASSIFYING"],
    doneAfter: ["EXTRACTING", "VERIFYING", "DONE"],
    description: "Identification du type",
    detail:
      "Gemini 2.5 Flash lit le texte OCR et détermine le type de document : facture, devis, attestation URSSAF, bon de commande… Le score de confiance est calculé et mémorisé.",
    color: "cyan",
  },
  {
    id: "extract",
    label: "Extraction",
    icon: FileSearch,
    activeStatus: ["EXTRACTING"],
    doneAfter: ["VERIFYING", "DONE"],
    description: "Champs structurés",
    detail:
      "Gemini 2.5 Flash extrait les champs clés selon le type de document : SIREN/SIRET, numéro de facture, montants HT/TVA/TTC, IBAN, conditions de paiement, identité émetteur/destinataire. Les données enrichies sont sauvegardées dans la couche Silver.",
    color: "teal",
  },
  {
    id: "verify",
    label: "Vérification",
    icon: ShieldCheck,
    activeStatus: ["VERIFYING"],
    doneAfter: ["DONE"],
    description: "Détection de fraude",
    detail:
      "Gemini 2.5 Pro inspecte les données extraites à la recherche d'anomalies : montants suspects, SIREN invalide, IBAN incohérent, incohérence de TVA, duplication de facture. Les alertes générées alimentent le tableau de conformité.",
    color: "amber",
  },
  {
    id: "done",
    label: "Terminé",
    icon: CheckCircle2,
    activeStatus: ["DONE"],
    doneAfter: [],
    description: "Disponible",
    detail:
      "Le document est entièrement traité. Les données structurées sont indexées dans la couche Gold (MinIO) et disponibles dans la vue Documents avec son score de conformité.",
    color: "emerald",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getStepState(
  step: PipelineStep,
  status: DocumentStatus | null,
  isError: boolean
): "waiting" | "active" | "done" | "error" {
  if (isError) {
    if (status && step.activeStatus.includes(status)) return "error";
    if (status && step.doneAfter.includes(status)) return "done";
    return "waiting";
  }
  if (!status) return "waiting";
  if (step.activeStatus.includes(status)) return "active";
  if (step.doneAfter.includes(status)) return "done";
  return "waiting";
}

// ── Sous-composants ────────────────────────────────────────────────────────

function StepNode({
  step,
  state,
  isLast,
  onClick,
  isSelected,
}: {
  step: PipelineStep;
  state: "waiting" | "active" | "done" | "error";
  isLast: boolean;
  onClick: () => void;
  isSelected: boolean;
}) {
  const Icon = state === "error" ? XCircle : step.icon;
  const c = COLOR_MAP[step.color];

  const ringColor =
    state === "waiting"
      ? "border-white/10"
      : state === "active"
      ? c.ring
      : state === "done"
      ? "border-emerald-500/60"
      : "border-red-500";

  const iconColor =
    state === "waiting"
      ? "text-white/20"
      : state === "active"
      ? c.icon
      : state === "done"
      ? "text-emerald-400"
      : "text-red-400";

  const labelColor =
    state === "waiting"
      ? "text-white/30"
      : state === "active"
      ? c.label
      : state === "done"
      ? "text-white/70"
      : "text-red-400";

  const nodeBg = state === "active" ? `${c.bg} shadow-lg ${c.shadow}` : "bg-white/5";

  return (
    <div className="flex items-center gap-0">
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 group"
        type="button"
      >
        {/* Node circle */}
        <div className="relative">
          {state === "active" && (
            <motion.div
              className={`absolute inset-0 rounded-full ${c.pulse}`}
              animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <motion.div
            className={`relative w-11 h-11 rounded-full border-2 ${ringColor} ${nodeBg} flex items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? "scale-110" : "hover:scale-105"}`}
            animate={state === "active" ? { scale: [1, 1.04, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {state === "active" ? (
              <Loader2 className={`w-5 h-5 ${iconColor} animate-spin`} />
            ) : (
              <Icon className={`w-5 h-5 ${iconColor}`} />
            )}
          </motion.div>
        </div>

        {/* Label */}
        <span className={`text-xs font-medium ${labelColor} transition-colors duration-300 whitespace-nowrap font-[Syne]`}>
          {step.label}
        </span>
      </button>

      {/* Connector */}
      {!isLast && (
        <div className="flex-1 mx-2 mb-5">
          <div
            className={`h-px w-12 transition-all duration-700 ${
              state === "done" ? "bg-emerald-500/50" : "bg-white/10"
            }`}
          />
        </div>
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

interface PipelineVisualizerProps {
  documentId?: string | null;
  /** Statut connu directement (si pas de polling nécessaire) */
  forcedStatus?: DocumentStatus | null;
}

export function PipelineVisualizer({ documentId, forcedStatus }: PipelineVisualizerProps) {
  const { data: statusData } = useDocumentStatus(documentId ?? "", !!documentId);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const rawStatus = (forcedStatus ?? statusData?.status ?? null) as DocumentStatus | null;
  const isError = rawStatus === "ERROR";

  // Auto-select active step
  useEffect(() => {
    if (!rawStatus) return;
    const active = STEPS.find((s) => s.activeStatus.includes(rawStatus as DocumentStatus));
    if (active) setSelectedStep(active.id);
    else if (rawStatus === "DONE") setSelectedStep("done");
  }, [rawStatus]);

  const displayedStep =
    selectedStep != null
      ? STEPS.find((s) => s.id === selectedStep) ?? null
      : null;

  const activeStep = STEPS.find((s) => s.activeStatus.includes(rawStatus as DocumentStatus));

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-[Syne]">
          Pipeline de traitement IA
        </p>
        {rawStatus && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              rawStatus === "DONE"
                ? "bg-emerald-500/20 text-emerald-300"
                : rawStatus === "ERROR"
                ? "bg-red-500/20 text-red-300"
                : "bg-indigo-500/20 text-indigo-300"
            }`}
          >
            {rawStatus === "DONE"
              ? "Terminé"
              : rawStatus === "ERROR"
              ? "Erreur"
              : "En cours…"}
          </span>
        )}
      </div>

      {/* Steps row */}
      <div className="flex items-start justify-between overflow-x-auto pb-1">
        {STEPS.map((step, i) => (
          <StepNode
            key={step.id}
            step={step}
            state={getStepState(step, rawStatus, isError)}
            isLast={i === STEPS.length - 1}
            onClick={() => setSelectedStep(step.id === selectedStep ? null : step.id)}
            isSelected={selectedStep === step.id}
          />
        ))}
      </div>

      {/* Description panel */}
      <AnimatePresence mode="wait">
        {displayedStep && (() => {
          const dc = COLOR_MAP[displayedStep.color];
          return (
            <motion.div
              key={displayedStep.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`rounded-xl p-4 bg-white/5 border ${dc.border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${dc.badge} shrink-0 mt-0.5`}>
                  <displayedStep.icon className={`w-4 h-4 ${dc.icon}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${dc.title} font-[Syne]`}>
                      {displayedStep.label}
                    </p>
                    <span className="text-xs text-[var(--text-secondary)]">
                      — {displayedStep.description}
                    </span>
                    {activeStep?.id === displayedStep.id && (
                      <span className={`flex items-center gap-1 text-xs ${dc.label}`}>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        actif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {displayedStep.detail}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {!displayedStep && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-3"
          >
            <p className="text-xs text-[var(--text-secondary)]">
              Cliquez sur une étape pour voir ce qui se passe réellement
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {rawStatus && rawStatus !== "ERROR" && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>Progression globale</span>
            <span>
              {rawStatus === "DONE"
                ? "100%"
                : `${Math.round(
                    ((STEPS.findIndex((s) => s.activeStatus.includes(rawStatus as DocumentStatus)) + 0.5) /
                      STEPS.length) *
                      100
                  )}%`}
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width:
                  rawStatus === "DONE"
                    ? "100%"
                    : `${Math.round(
                        ((STEPS.findIndex((s) => s.activeStatus.includes(rawStatus as DocumentStatus)) + 0.5) /
                          STEPS.length) *
                          100
                      )}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
