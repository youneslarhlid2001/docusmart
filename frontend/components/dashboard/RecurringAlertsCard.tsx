"use client";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { RecurringAlertSupplier } from "@/lib/types";

interface Props {
  data: RecurringAlertSupplier[];
}

const SEVERITY_CLASSES = [
  "text-red-400 border-red-500/30 bg-red-500/10",
  "text-orange-400 border-orange-500/30 bg-orange-500/10",
  "text-amber-400 border-amber-500/30 bg-amber-500/10",
  "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  "text-slate-400 border-slate-500/30 bg-slate-500/10",
];

export function RecurringAlertsCard({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[var(--text-secondary)] text-sm">
        Aucun fournisseur problématique détecté
      </div>
    );
  }

  const maxAlerts = Math.max(...data.map((s) => s.total_alerts), 1);

  return (
    <div className="space-y-3">
      {data.map((supplier, i) => {
        const pct = Math.round((supplier.total_alerts / maxAlerts) * 100);
        const openRatio = supplier.total_alerts > 0
          ? supplier.open_alerts / supplier.total_alerts
          : 0;

        return (
          <motion.div
            key={supplier.siren}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {supplier.name}
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  {supplier.siren}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className={`text-xs px-1.5 py-0.5 rounded border ${SEVERITY_CLASSES[i] ?? SEVERITY_CLASSES[4]}`}>
                  {supplier.open_alerts} ouvertes
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  {supplier.total_alerts} total
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: openRatio > 0.6
                    ? "linear-gradient(90deg, #EF4444, #DC2626)"
                    : openRatio > 0.3
                    ? "linear-gradient(90deg, #F59E0B, #D97706)"
                    : "linear-gradient(90deg, #6366F1, #06B6D4)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.05 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
