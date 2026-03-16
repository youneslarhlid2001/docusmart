"use client";
import { motion } from "framer-motion";
import { AlertTriangle, AlertOctagon, Info, ChevronRight } from "lucide-react";
import { cn, SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/utils";
import type { ComplianceAlert } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface FraudAlertProps {
  alert: ComplianceAlert;
  onResolve?: (id: string) => void;
  onFalsePositive?: (id: string) => void;
  compact?: boolean;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  SIRET_MISMATCH: "SIRET incohérent",
  TVA_ERROR: "Erreur TVA",
  TVA_INTRA_INVALID: "N° TVA intra invalide",
  IBAN_CONFLICT: "IBAN conflictuel",
  DUPLICATE_INVOICE: "Facture dupliquée",
  DATE_EXPIRED: "Document expiré",
  AMOUNT_SUSPICIOUS: "Montant suspect",
};

export function FraudAlert({ alert, onResolve, onFalsePositive, compact = false }: FraudAlertProps) {
  const SeverityIcon =
    alert.severity === "CRITICAL" || alert.severity === "HIGH"
      ? AlertOctagon
      : alert.severity === "MEDIUM"
      ? AlertTriangle
      : Info;

  const iconColor =
    alert.severity === "CRITICAL"
      ? "text-red-400"
      : alert.severity === "HIGH"
      ? "text-orange-400"
      : alert.severity === "MEDIUM"
      ? "text-amber-400"
      : "text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "glass-card p-4 border",
        alert.severity === "CRITICAL" && "border-red-500/30 bg-red-500/5",
        alert.severity === "HIGH" && "border-orange-500/30 bg-orange-500/5",
        alert.severity === "MEDIUM" && "border-amber-500/30 bg-amber-500/5",
        alert.severity === "LOW" && "border-slate-500/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
          alert.severity === "CRITICAL" && "bg-red-500/20",
          alert.severity === "HIGH" && "bg-orange-500/20",
          alert.severity === "MEDIUM" && "bg-amber-500/20",
          alert.severity === "LOW" && "bg-slate-500/20"
        )}>
          <SeverityIcon className={cn("w-4 h-4", iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[var(--text-primary)] font-[Syne]">
              {ALERT_TYPE_LABELS[alert.alert_type || ""] || alert.alert_type}
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full border",
              SEVERITY_COLORS[alert.severity]
            )}>
              {SEVERITY_LABELS[alert.severity]}
            </span>
          </div>

          {!compact && (
            <>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{alert.description}</p>

              {(alert.field_source || alert.field_target) && (
                <div className="mt-2 flex items-center gap-2 text-xs font-[JetBrains_Mono]">
                  {alert.field_source && (
                    <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      {alert.field_source}: <span className="text-red-400">{alert.value_source}</span>
                    </span>
                  )}
                  {alert.field_target && (
                    <>
                      <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                        {alert.field_target}: <span className="text-emerald-400">{alert.value_target}</span>
                      </span>
                    </>
                  )}
                </div>
              )}

              {alert.status === "OPEN" && (onResolve || onFalsePositive) && (
                <div className="mt-3 flex gap-2">
                  {onResolve && (
                    <Button size="sm" variant="secondary" onClick={() => onResolve(alert.id)}>
                      Résoudre
                    </Button>
                  )}
                  {onFalsePositive && (
                    <Button size="sm" variant="ghost" onClick={() => onFalsePositive(alert.id)}>
                      Faux positif
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
