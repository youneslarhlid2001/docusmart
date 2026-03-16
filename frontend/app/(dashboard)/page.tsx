"use client";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProcessingChart } from "@/components/dashboard/ProcessingChart";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useStats, useAlerts } from "@/hooks/useDocuments";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: alerts = [] } = useAlerts({ status: "OPEN" });

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)]">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[Syne]">
            Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Vue d'ensemble du traitement documentaire
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <RefreshCw className="w-3 h-3" />
          Mise à jour automatique
        </div>
      </motion.div>

      {/* KPI Stats */}
      <StatsCards stats={stats} />

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume chart — 2/3 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Volume de documents (7 derniers jours)</CardTitle>
              <span className="text-xs text-[var(--text-secondary)]">
                {stats.total_documents} au total
              </span>
            </CardHeader>
            <CardContent>
              <ProcessingChart data={stats.documents_last_7_days} />
            </CardContent>
          </Card>
        </div>

        {/* Types breakdown — 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle>Par type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.documents_by_type).length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                  Aucun document traité
                </p>
              ) : (
                Object.entries(stats.documents_by_type).map(([type, count]) => {
                  const pct = Math.round((count / stats.total_documents) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{type}</span>
                        <span className="text-[var(--text-primary)] font-mono">{count}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertes feed — full width */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Alertes récentes</CardTitle>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                alerts.length > 0
                  ? "bg-red-500/20 text-red-300 border-red-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              }`}>
                {alerts.length} alerte(s) active(s)
              </span>
            </CardHeader>
            <CardContent>
              <AlertsFeed alerts={alerts} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
