"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Activity, AlertTriangle, GitMerge } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ComplianceTrendChart } from "@/components/dashboard/ComplianceTrendChart";
import { AnomalyHeatmap } from "@/components/dashboard/AnomalyHeatmap";
import { SupplierRadarChart } from "@/components/dashboard/SupplierRadarChart";
import { SankeyChart } from "@/components/dashboard/SankeyChart";
import { RecurringAlertsCard } from "@/components/dashboard/RecurringAlertsCard";
import { useAnalytics } from "@/hooks/useDocuments";

const PERIOD_OPTIONS = [
  { label: "3 mois", value: 3 },
  { label: "6 mois", value: 6 },
  { label: "12 mois", value: 12 },
];

export default function AnalyticsPage() {
  const [months, setMonths] = useState(6);
  const { data, isLoading } = useAnalytics(months);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[Syne] flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
            Analytique avancée
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Pilotage stratégique — tendances, anomalies et comparaison fournisseurs
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMonths(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                months === opt.value
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-[var(--text-secondary)]">Chargement des analytics...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Compliance trend (full width) */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <CardTitle>Évolution du taux de conformité</CardTitle>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  Conformité mensuelle · alertes · documents traités — {months} derniers mois
                </span>
              </CardHeader>
              <CardContent>
                <ComplianceTrendChart data={data.compliance_trend} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Row 2: Heatmap + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <CardTitle>Heatmap des anomalies</CardTitle>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Nombre d'alertes par type de document × mois
                  </span>
                </CardHeader>
                <CardContent>
                  <AnomalyHeatmap data={data.anomaly_heatmap} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <CardTitle>Comparaison fournisseurs</CardTitle>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Radar multi-dimensionnel — top 6 fournisseurs par volume
                  </span>
                </CardHeader>
                <CardContent>
                  <SupplierRadarChart data={data.supplier_radar} />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Row 3: Sankey + Recurring alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-purple-400" />
                    <CardTitle>Flux documentaire</CardTitle>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Types de documents → types d'alertes → sévérité
                  </span>
                </CardHeader>
                <CardContent>
                  <SankeyChart data={data.document_flow} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <CardTitle>Fournisseurs problématiques</CardTitle>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Alertes récurrentes détectées automatiquement
                  </span>
                </CardHeader>
                <CardContent>
                  <RecurringAlertsCard data={data.recurring_alerts} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
