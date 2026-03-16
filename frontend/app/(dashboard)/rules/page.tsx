"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Plus, Trash2, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Lock, Zap, GitBranch,
  Building2, Heart, ShoppingCart, Globe, X, Save, AlertTriangle,
} from "lucide-react";
import { fraudRulesApi } from "@/lib/api";
import type { FraudRule, FraudRuleCreate, AlertSeverity, RuleCategory } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  CRITICAL: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const SECTOR_STYLES: Record<string, { label: string; icon: any; color: string; border: string; bg: string }> = {
  GENERIC: { label: "Générique", icon: Globe, color: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10" },
  BTP: { label: "BTP", icon: Building2, color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  SANTE: { label: "Santé", icon: Heart, color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" },
  RETAIL: { label: "Retail", icon: ShoppingCart, color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
};

const DOC_TYPES = ["FACTURE", "DEVIS", "ATTESTATION_URSSAF", "ATTESTATION_FISCALE", "BON_COMMANDE", "CONTRAT"];

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.MEDIUM}`}>
      {severity}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
      category === "AUTONOMOUS"
        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
        : "bg-violet-500/20 text-violet-300 border-violet-500/30"
    }`}>
      {category === "AUTONOMOUS" ? <Zap className="w-2.5 h-2.5" /> : <GitBranch className="w-2.5 h-2.5" />}
      {category === "AUTONOMOUS" ? "Autonome" : "Croisée"}
    </span>
  );
}

// ── Rule Card ─────────────────────────────────────────────────────────────────

function RuleCard({ rule, onToggle, onDelete }: {
  rule: FraudRule;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sector = SECTOR_STYLES[rule.sector] ?? SECTOR_STYLES.GENERIC;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border transition-all duration-200 ${
        rule.active
          ? `${sector.border} ${sector.bg}`
          : "border-[var(--border)] bg-[var(--bg-elevated)] opacity-50"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Toggle */}
        <button
          onClick={() => onToggle(rule.id, !rule.active)}
          className="flex-shrink-0"
          title={rule.active ? "Désactiver la règle" : "Activer la règle"}
        >
          {rule.active
            ? <ToggleRight className={`w-6 h-6 ${sector.color}`} />
            : <ToggleLeft className="w-6 h-6 text-[var(--text-secondary)]" />
          }
        </button>

        {/* Info principale */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-[var(--text-secondary)]">{rule.code}</span>
            {rule.is_builtin && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 border border-slate-500/30 bg-slate-500/10 px-1.5 py-0.5 rounded">
                <Lock className="w-2.5 h-2.5" /> natif
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5 truncate">{rule.name}</p>
        </div>

        {/* Badges */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <CategoryBadge category={rule.category} />
          <SeverityBadge severity={rule.severity} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!rule.is_builtin && (
            <button
              onClick={() => onDelete(rule.id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] space-y-3 mt-0">
              <p className="text-xs text-[var(--text-secondary)] pt-3">{rule.description}</p>

              {rule.document_types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-[var(--text-secondary)] mr-1">Applique à :</span>
                  {rule.document_types.map((dt) => (
                    <span key={dt} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                      {dt}
                    </span>
                  ))}
                </div>
              )}

              {(rule.condition_json as any)?.prompt_instruction && (
                <div className="rounded-lg bg-black/30 border border-[var(--border)] p-3">
                  <p className="text-[10px] text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-medium">Instruction Gemini</p>
                  <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {(rule.condition_json as any).prompt_instruction}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── New Rule Modal ─────────────────────────────────────────────────────────────

const EMPTY_FORM: FraudRuleCreate = {
  code: "",
  name: "",
  description: "",
  category: "AUTONOMOUS",
  condition_json: {},
  severity: "MEDIUM",
  document_types: [],
  sector: "GENERIC",
  active: true,
};

function NewRuleModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (payload: FraudRuleCreate) => void;
}) {
  const [form, setForm] = useState<FraudRuleCreate>(EMPTY_FORM);
  const [promptText, setPromptText] = useState("");
  const [docTypeInput, setDocTypeInput] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!form.code || !form.name || !promptText) return;
    onCreate({
      ...form,
      code: form.code.toUpperCase().replace(/\s+/g, "_"),
      condition_json: { type: "custom", prompt_instruction: promptText },
      document_types: docTypeInput,
    });
  };

  const toggleDocType = (dt: string) => {
    setDocTypeInput((prev) =>
      prev.includes(dt) ? prev.filter((x) => x !== dt) : [...prev, dt]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="font-bold text-[var(--text-primary)] font-[Syne]">Nouvelle règle</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Code *</label>
              <input
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 uppercase"
                placeholder="ex: BTP_MONTANT_MAX"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Secteur</label>
              <select
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value as any })}
              >
                {Object.entries(SECTOR_STYLES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Nom *</label>
            <input
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50"
              placeholder="Nom lisible de la règle"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Description</label>
            <textarea
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 resize-none"
              rows={2}
              placeholder="Description courte de ce que détecte la règle"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Catégorie</label>
              <select
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as RuleCategory })}
              >
                <option value="AUTONOMOUS">Autonome (sans docs liés)</option>
                <option value="CROSS_DOC">Croisée (compare historique)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Sévérité par défaut</label>
              <select
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as AlertSeverity })}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Types de documents (vide = tous)</label>
            <div className="flex flex-wrap gap-1.5">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt}
                  onClick={() => toggleDocType(dt)}
                  className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-colors ${
                    docTypeInput.includes(dt)
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-indigo-500/30"
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">
              Instruction pour Gemini *{" "}
              <span className="text-[10px] opacity-60">— texte injecté dans le prompt de détection</span>
            </label>
            <textarea
              className="w-full bg-black/30 border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500/50 resize-none"
              rows={5}
              placeholder={`ex: MON_CODE : Si montant_ttc > 50000€ sans justification → ALERTE HIGH.`}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.code || !form.name || !promptText}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" /> Créer la règle
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RulesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filterSector, setFilterSector] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [seedingMsg, setSeedingMsg] = useState<string | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["fraud-rules"],
    queryFn: () => fraudRulesApi.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      fraudRulesApi.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fraud-rules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fraudRulesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fraud-rules"] }),
  });

  const createMutation = useMutation({
    mutationFn: fraudRulesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-rules"] });
      setShowModal(false);
    },
  });

  const seedSector = async (sector: string) => {
    try {
      const res = await fraudRulesApi.seedSector(sector);
      setSeedingMsg(res.message);
      queryClient.invalidateQueries({ queryKey: ["fraud-rules"] });
      setTimeout(() => setSeedingMsg(null), 3000);
    } catch (e: any) {
      setSeedingMsg(e.message);
      setTimeout(() => setSeedingMsg(null), 3000);
    }
  };

  // Filtering
  const filtered = rules.filter((r) => {
    if (filterSector !== "ALL" && r.sector !== filterSector) return false;
    if (filterCategory !== "ALL" && r.category !== filterCategory) return false;
    return true;
  });

  const activeCount = rules.filter((r) => r.active).length;
  const byCategory = (cat: string) => filtered.filter((r) => r.category === cat);

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[Syne]">Règles de fraude</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gérez les règles injectées dans le prompt Gemini à chaque analyse de document.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Nouvelle règle
        </button>
      </motion.div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.05 } }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: rules.length, color: "text-[var(--text-primary)]" },
          { label: "Actives", value: activeCount, color: "text-emerald-400" },
          { label: "Inactives", value: rules.length - activeCount, color: "text-slate-400" },
          { label: "Personnalisées", value: rules.filter((r) => !r.is_builtin).length, color: "text-indigo-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center">
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Import secteurs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Importer des règles sectorielles prédéfinies</p>
        <div className="flex flex-wrap gap-2">
          {(["BTP", "SANTE", "RETAIL"] as const).map((sector) => {
            const s = SECTOR_STYLES[sector];
            return (
              <button
                key={sector}
                onClick={() => seedSector(sector)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:scale-105 ${s.bg} ${s.border} ${s.color}`}
              >
                <s.icon className="w-4 h-4" /> {s.label}
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {seedingMsg && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-emerald-400 mt-3 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> {seedingMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filtres */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.12 } }}
        className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1">
          {["ALL", "GENERIC", "BTP", "SANTE", "RETAIL"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSector(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterSector === s
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {s === "ALL" ? "Tous secteurs" : SECTOR_STYLES[s].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1">
          {[
            { key: "ALL", label: "Toutes" },
            { key: "AUTONOMOUS", label: "Autonomes" },
            { key: "CROSS_DOC", label: "Croisées" },
          ].map((c) => (
            <button
              key={c.key}
              onClick={() => setFilterCategory(c.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterCategory === c.key
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Règles par catégorie */}
      {!isLoading && (
        <div className="space-y-8">
          {/* Autonomes */}
          {byCategory("AUTONOMOUS").length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Règles autonomes</h3>
                <span className="text-xs text-[var(--text-secondary)]">— vérifiées sans historique</span>
                <span className="ml-auto text-xs font-mono text-blue-400">
                  {byCategory("AUTONOMOUS").filter(r => r.active).length}/{byCategory("AUTONOMOUS").length} actives
                </span>
              </div>
              <div className="space-y-2">
                {byCategory("AUTONOMOUS").map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={(id, active) => toggleMutation.mutate({ id, active })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Croisées */}
          {byCategory("CROSS_DOC").length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Règles croisées</h3>
                <span className="text-xs text-[var(--text-secondary)]">— comparaison avec l'historique</span>
                <span className="ml-auto text-xs font-mono text-violet-400">
                  {byCategory("CROSS_DOC").filter(r => r.active).length}/{byCategory("CROSS_DOC").length} actives
                </span>
              </div>
              <div className="space-y-2">
                {byCategory("CROSS_DOC").map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={(id, active) => toggleMutation.mutate({ id, active })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <AlertTriangle className="w-10 h-10 text-[var(--text-secondary)] mx-auto" />
              <p className="text-[var(--text-secondary)]">Aucune règle trouvée.</p>
              <p className="text-xs text-[var(--text-secondary)]">Importez des règles sectorielles ou créez-en une.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <NewRuleModal
            onClose={() => setShowModal(false)}
            onCreate={(payload) => createMutation.mutate(payload)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
