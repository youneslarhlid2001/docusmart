"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { cn, SEVERITY_COLORS, SEVERITY_LABELS, formatDate } from "@/lib/utils";
import type { ComplianceAlert } from "@/lib/types";

interface AlertsFeedProps {
  alerts: ComplianceAlert[];
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  SIRET_MISMATCH: "SIRET incohérent",
  TVA_ERROR: "Erreur TVA",
  IBAN_CONFLICT: "IBAN conflictuel",
  DUPLICATE_INVOICE: "Facture dupliquée",
  DATE_EXPIRED: "Document expiré",
  AMOUNT_SUSPICIOUS: "Montant suspect",
};

export function AlertsFeed({ alerts }: AlertsFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-secondary)]">
        <Info className="w-8 h-8 opacity-50" />
        <p className="text-sm">Aucune alerte active</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      <AnimatePresence>
        {alerts.slice(0, 10).map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              alert.severity === "CRITICAL" && "border-red-500/20 bg-red-500/5",
              alert.severity === "HIGH" && "border-orange-500/20 bg-orange-500/5",
              alert.severity === "MEDIUM" && "border-amber-500/20 bg-amber-500/5",
              alert.severity === "LOW" && "border-[var(--border)]"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
              alert.severity === "CRITICAL" ? "bg-red-500/20" :
              alert.severity === "HIGH" ? "bg-orange-500/20" :
              alert.severity === "MEDIUM" ? "bg-amber-500/20" : "bg-slate-500/20"
            )}>
              {alert.severity === "CRITICAL" || alert.severity === "HIGH" ? (
                <AlertOctagon className={cn("w-3 h-3", alert.severity === "CRITICAL" ? "text-red-400" : "text-orange-400")} />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {ALERT_TYPE_LABELS[alert.alert_type || ""] || alert.alert_type}
                </span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full border", SEVERITY_COLORS[alert.severity])}>
                  {SEVERITY_LABELS[alert.severity]}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{alert.description}</p>
              <p className="text-xs text-[var(--text-secondary)] opacity-60 mt-0.5">{formatDate(alert.created_at)}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
