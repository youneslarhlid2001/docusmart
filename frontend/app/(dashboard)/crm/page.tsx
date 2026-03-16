"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, FileText, ShieldCheck, ChevronRight, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSuppliers, useSupplierDocuments } from "@/hooks/useDocuments";
import { formatDate } from "@/lib/utils";
import type { Supplier } from "@/lib/types";

function ComplianceGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <span className="text-sm font-[JetBrains_Mono] font-medium" style={{ color }}>
        {score.toFixed(0)}%
      </span>
    </div>
  );
}

function SupplierDetail({ supplier }: { supplier: Supplier }) {
  const { data: docs = [] } = useSupplierDocuments(supplier.siren);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Raison sociale</p>
          <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
            {supplier.raison_sociale ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">SIRET</p>
          <p className="text-sm font-[JetBrains_Mono] text-cyan-300 mt-1">
            {supplier.siret ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Documents</p>
          <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
            {supplier.document_count}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Dernier document</p>
          <p className="text-sm text-[var(--text-primary)] mt-1">
            {formatDate(supplier.last_document_at)}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs text-[var(--text-secondary)] mb-2">Score de conformité</p>
        <ComplianceGauge score={supplier.compliance_score} />
      </div>
      {docs.length > 0 && (
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-2">Documents récents</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {docs.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-xs p-2 rounded bg-[var(--bg-elevated)]">
                <span className="text-[var(--text-primary)] truncate max-w-[180px]">{doc.original_name}</span>
                <span className={`px-1.5 py-0.5 rounded border text-xs ${
                  doc.status === "DONE"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]"
                }`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CRMPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [selectedSiren, setSelectedSiren] = useState<string | null>(null);
  const selectedSupplier = suppliers.find((s) => s.siren === selectedSiren);

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[Syne]">
          CRM Fournisseurs
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {suppliers.length} fournisseur(s) référencé(s)
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Liste */}
        <div className="xl:col-span-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-5 h-24 animate-pulse" />
            ))
          ) : suppliers.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
              <p className="text-[var(--text-secondary)]">
                Aucun fournisseur. Uploadez des documents pour les voir apparaître ici.
              </p>
            </div>
          ) : (
            suppliers.map((supplier, i) => (
              <motion.div
                key={supplier.siren}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedSiren(supplier.siren === selectedSiren ? null : supplier.siren)}
                className={`glass-card p-5 cursor-pointer transition-all duration-200 hover:border-indigo-500/30 ${
                  selectedSiren === supplier.siren ? "border-indigo-500/50 glow" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                    <Building2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--text-primary)] font-[Syne]">
                        {supplier.raison_sociale ?? "Inconnu"}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${
                        selectedSiren === supplier.siren ? "rotate-90" : ""
                      }`} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                      <span className="font-[JetBrains_Mono]">{supplier.siren}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {supplier.document_count} doc(s)
                      </span>
                    </div>
                    <div className="mt-2">
                      <ComplianceGauge score={supplier.compliance_score} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Détail */}
        <div>
          {selectedSupplier ? (
            <Card glow>
              <CardHeader>
                <CardTitle>{selectedSupplier.raison_sociale ?? selectedSupplier.siren}</CardTitle>
                <span className="text-xs font-[JetBrains_Mono] text-cyan-300">{selectedSupplier.siren}</span>
              </CardHeader>
              <CardContent>
                <SupplierDetail supplier={selectedSupplier} />
              </CardContent>
            </Card>
          ) : (
            <div className="glass-card p-8 text-center text-[var(--text-secondary)]">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sélectionnez un fournisseur</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
