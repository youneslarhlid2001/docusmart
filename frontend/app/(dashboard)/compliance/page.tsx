"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Filter, FileDown } from "lucide-react";
import { FraudAlert } from "@/components/documents/FraudAlert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAlerts, useUpdateAlert, useStats } from "@/hooks/useDocuments";
import { exportApi } from "@/lib/api";

// Gauge chart simple avec SVG
function ComplianceGaugeChart({ score }: { score: number }) {
  const radius = 60;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="160" height="90" viewBox="0 0 160 90">
        <path
          d={`M 10 80 A ${radius} ${radius} 0 0 1 150 80`}
          fill="none"
          stroke="rgba(99,102,241,0.1)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M 10 80 A ${radius} ${radius} 0 0 1 150 80`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="80" y="72" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color} fontFamily="JetBrains Mono">
          {score.toFixed(0)}%
        </text>
      </svg>
      <p className="text-xs text-[var(--text-secondary)]">Score global de conformité</p>
    </div>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "OPEN", label: "Ouvertes" },
  { value: "RESOLVED", label: "Résolues" },
  { value: "FALSE_POSITIVE", label: "Faux positifs" },
];

const SEVERITY_FILTER_OPTIONS = [
  { value: "", label: "Toutes sévérités" },
  { value: "CRITICAL", label: "Critique" },
  { value: "HIGH", label: "Élevée" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "LOW", label: "Faible" },
];

export default function CompliancePage() {
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [severityFilter, setSeverityFilter] = useState("");

  const { data: alerts = [], isLoading } = useAlerts({
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
  });
  const { data: stats } = useStats();
  const updateAlert = useUpdateAlert();

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a) => a.severity === "HIGH").length;
  const openCount = alerts.filter((a) => a.status === "OPEN").length;

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[Syne]">
            Conformité
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gestion des incohérences documentaires
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => exportApi.complianceExcel()}>
          <FileDown className="w-4 h-4" />
          Exporter Excel
        </Button>
      </motion.div>

      {/* Score + stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 flex flex-col items-center justify-center py-4">
          <ComplianceGaugeChart score={stats?.compliance_rate ?? 100} />
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/10">
          <CardContent className="pt-4">
            <p className="text-xs text-[var(--text-secondary)] font-[Syne] uppercase tracking-wider">Alertes critiques</p>
            <p className="text-3xl font-bold text-red-400 font-[Syne] mt-1">{criticalCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10">
          <CardContent className="pt-4">
            <p className="text-xs text-[var(--text-secondary)] font-[Syne] uppercase tracking-wider">Alertes élevées</p>
            <p className="text-3xl font-bold text-amber-400 font-[Syne] mt-1">{highCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
          <CardContent className="pt-4">
            <p className="text-xs text-[var(--text-secondary)] font-[Syne] uppercase tracking-wider">Total ouvertes</p>
            <p className="text-3xl font-bold text-indigo-400 font-[Syne] mt-1">{openCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="glass-card p-4 flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
        <div className="w-44">
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            options={SEVERITY_FILTER_OPTIONS}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          />
        </div>
        <span className="text-sm text-[var(--text-secondary)] ml-auto">
          {alerts.length} résultat(s)
        </span>
      </div>

      {/* Liste des alertes */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-70" />
          <h3 className="text-xl font-semibold text-[var(--text-primary)] font-[Syne]">
            Aucune incohérence détectée
          </h3>
          <p className="text-[var(--text-secondary)] mt-2">
            Tous les documents analysés sont conformes
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <FraudAlert
                alert={alert}
                onResolve={alert.status === "OPEN" ? (id) => updateAlert.mutate({ id, status: "RESOLVED" }) : undefined}
                onFalsePositive={alert.status === "OPEN" ? (id) => updateAlert.mutate({ id, status: "FALSE_POSITIVE" }) : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
