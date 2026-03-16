"use client";
import { motion } from "framer-motion";
import {
  Upload, FileSearch, Tag, Layers, ShieldCheck, Database,
  ArrowRight, ArrowDown, Cpu, Globe, Server, HardDrive,
  Zap, GitBranch, BarChart3, Users, AlertTriangle, CheckCircle2,
  Package, Brain, CloudUpload, RefreshCw, Lock, FileText
} from "lucide-react";

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] font-[Syne]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Pipeline step ────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  {
    step: "01", label: "UPLOAD", sublabel: "Réception fichier",
    icon: CloudUpload, color: "from-slate-500 to-slate-400",
    border: "border-slate-500/30", bg: "bg-slate-500/10",
    text: "text-slate-300",
    desc: "L'utilisateur dépose un PDF via le frontend. Le fichier est envoyé au backend FastAPI via multipart/form-data.",
    details: ["Validation du type MIME", "UUID assigné au document", "Statut → UPLOADED", "Tâche Celery enqueued"],
  },
  {
    step: "02", label: "BRONZE", sublabel: "Stockage brut",
    icon: HardDrive, color: "from-amber-700 to-amber-600",
    border: "border-amber-700/30", bg: "bg-amber-700/10",
    text: "text-amber-400",
    desc: "Le fichier brut est sauvegardé tel quel dans le bucket MinIO bronze. C'est la couche d'ingestion immuable.",
    details: ["Bucket: bronze/", "Fichier original conservé", "Chemin stocké en BDD", "Statut → PROCESSING"],
  },
  {
    step: "03", label: "OCR", sublabel: "Extraction de texte",
    icon: FileSearch, color: "from-blue-600 to-blue-500",
    border: "border-blue-500/30", bg: "bg-blue-500/10",
    text: "text-blue-300",
    desc: "Google Document AI analyse le PDF et extrait le texte intégral ainsi que les entités détectées.",
    details: ["Google Document AI API", "Texte brut + entités", "Positions des champs", "Statut → OCR_PROCESSING"],
  },
  {
    step: "04", label: "CLASSIFY", sublabel: "Type de document",
    icon: Tag, color: "from-violet-600 to-violet-500",
    border: "border-violet-500/30", bg: "bg-violet-500/10",
    text: "text-violet-300",
    desc: "Gemini 2.0 Flash analyse le texte OCR et détermine le type de document parmi les catégories supportées.",
    details: ["Gemini 2.0 Flash", "7 types supportés", "Confiance 0–1", "Statut → CLASSIFYING"],
  },
  {
    step: "05", label: "EXTRACT", sublabel: "Extraction structurée",
    icon: Layers, color: "from-cyan-600 to-cyan-500",
    border: "border-cyan-500/30", bg: "bg-cyan-500/10",
    text: "text-cyan-300",
    desc: "Gemini extrait les champs métier selon un prompt type-spécifique (SIREN, IBAN, montants, dates…).",
    details: ["Prompt JSON schéma", "Champs + confiance", "Validation Pydantic", "Statut → EXTRACTING"],
  },
  {
    step: "06", label: "SILVER", sublabel: "Données nettoyées",
    icon: Database, color: "from-emerald-600 to-emerald-500",
    border: "border-emerald-500/30", bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    desc: "Les données structurées sont sérialisées en JSON et stockées dans le bucket silver. Le document est inséré en BDD.",
    details: ["Bucket: silver/", "JSON normalisé", "Insert PostgreSQL", "Fournisseur créé/mis à jour"],
  },
  {
    step: "07", label: "FRAUD", sublabel: "Détection fraude",
    icon: ShieldCheck, color: "from-rose-600 to-rose-500",
    border: "border-rose-500/30", bg: "bg-rose-500/10",
    text: "text-rose-300",
    desc: "Gemini 2.5 Pro analyse les données extraites avec des règles autonomes et cross-documents pour détecter des anomalies.",
    details: ["Gemini 2.5 Pro", "Règles autonomes + cross-docs", "Alertes créées en BDD", "Score fournisseur mis à jour"],
  },
  {
    step: "08", label: "GOLD", sublabel: "Données enrichies",
    icon: CheckCircle2, color: "from-yellow-500 to-amber-400",
    border: "border-yellow-500/30", bg: "bg-yellow-500/10",
    text: "text-yellow-300",
    desc: "Le document enrichi (données + résultats fraude) est archivé dans le bucket gold. Statut final mis à jour.",
    details: ["Bucket: gold/", "Données enrichies + alertes", "Statut → DONE", "Frontend notifié via polling"],
  },
];

// ─── Tech stack layers ────────────────────────────────────────────────────────
const TECH_LAYERS = [
  {
    label: "Présentation", color: "border-indigo-500/40 bg-indigo-500/5",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    items: [
      { name: "Next.js 15", desc: "App Router, SSR/SSG" },
      { name: "React 19", desc: "Concurrent features" },
      { name: "TailwindCSS", desc: "Utility-first CSS" },
      { name: "Framer Motion", desc: "Animations" },
      { name: "TanStack Query", desc: "Cache & polling" },
      { name: "Zustand", desc: "État global" },
    ],
  },
  {
    label: "API", color: "border-cyan-500/40 bg-cyan-500/5",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    items: [
      { name: "FastAPI", desc: "Framework async" },
      { name: "Pydantic v2", desc: "Validation schemas" },
      { name: "SQLAlchemy 2", desc: "ORM async" },
      { name: "Uvicorn", desc: "ASGI server" },
      { name: "Alembic", desc: "Migrations BDD" },
      { name: "asyncpg", desc: "Driver PostgreSQL" },
    ],
  },
  {
    label: "Pipeline IA", color: "border-violet-500/40 bg-violet-500/5",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    items: [
      { name: "Celery 5.4", desc: "Task queue async" },
      { name: "Redis 7", desc: "Broker + backend" },
      { name: "Google Doc AI", desc: "OCR avancé" },
      { name: "Gemini 2.0 Flash", desc: "Classification + extraction" },
      { name: "Gemini 2.5 Pro", desc: "Détection fraude" },
    ],
  },
  {
    label: "Persistance", color: "border-emerald-500/40 bg-emerald-500/5",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    items: [
      { name: "PostgreSQL 16", desc: "BDD relationnelle" },
      { name: "MinIO", desc: "Object storage S3" },
      { name: "JSONB", desc: "Données extraites" },
      { name: "UUID PK", desc: "Identifiants uniques" },
    ],
  },
];

// ─── Data models ──────────────────────────────────────────────────────────────
const DATA_MODELS = [
  {
    name: "Document", icon: FileText, color: "text-indigo-400", border: "border-indigo-500/30",
    fields: [
      { name: "id", type: "UUID", note: "PK" },
      { name: "filename", type: "str", note: "" },
      { name: "document_type", type: "enum", note: "7 types" },
      { name: "status", type: "enum", note: "Pipeline status" },
      { name: "extracted_data", type: "JSONB", note: "Champs + confiance" },
      { name: "ocr_text", type: "text", note: "" },
      { name: "supplier_siren", type: "str FK", note: "→ Supplier" },
      { name: "bronze/silver/gold_path", type: "str", note: "MinIO paths" },
      { name: "fraud_score", type: "float", note: "0–1" },
      { name: "created_at", type: "timestamp", note: "TZ-aware" },
    ],
  },
  {
    name: "Supplier", icon: Users, color: "text-cyan-400", border: "border-cyan-500/30",
    fields: [
      { name: "siren", type: "str(9)", note: "PK" },
      { name: "name", type: "str", note: "" },
      { name: "compliance_score", type: "float", note: "0–100" },
      { name: "document_count", type: "int", note: "" },
      { name: "last_document_at", type: "timestamp", note: "" },
      { name: "created_at", type: "timestamp", note: "" },
    ],
  },
  {
    name: "ComplianceAlert", icon: AlertTriangle, color: "text-rose-400", border: "border-rose-500/30",
    fields: [
      { name: "id", type: "UUID", note: "PK" },
      { name: "document_id", type: "UUID FK", note: "→ Document" },
      { name: "alert_type", type: "str", note: "Code règle" },
      { name: "severity", type: "enum", note: "LOW/MED/HIGH/CRIT" },
      { name: "status", type: "enum", note: "OPEN/RESOLVED" },
      { name: "description", type: "text", note: "" },
      { name: "detected_at", type: "timestamp", note: "" },
    ],
  },
];

// ─── Document types ───────────────────────────────────────────────────────────
const DOC_TYPES = [
  { code: "FACTURE", label: "Facture", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { code: "DEVIS", label: "Devis", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { code: "ATTESTATION_URSSAF", label: "Attestation URSSAF", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  { code: "ATTESTATION_FISCALE", label: "Attestation fiscale", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { code: "BON_COMMANDE", label: "Bon de commande", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { code: "CONTRAT", label: "Contrat", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  { code: "INCONNU", label: "Inconnu", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
];

// ─── Fraud rules ──────────────────────────────────────────────────────────────
const FRAUD_RULES = [
  {
    category: "Règles autonomes", icon: Lock, color: "text-rose-400",
    rules: [
      "Validation du calcul TVA (montant HT × taux = TTC)",
      "Format SIREN/SIRET (9/14 chiffres, algorithme Luhn)",
      "Validité IBAN (checksum ISO 13616)",
      "Numéro de facture en doublon",
      "Dates incohérentes (échéance < émission)",
    ],
  },
  {
    category: "Règles cross-documents", icon: GitBranch, color: "text-orange-400",
    rules: [
      "IBAN différent pour le même fournisseur (SIREN)",
      "SIRET incohérent vs documents précédents",
      "Montant anormalement élevé vs historique",
      "Fréquence de facturation suspecte",
      "Séquence de numéros non continue",
    ],
  },
];

// ─── API endpoints ────────────────────────────────────────────────────────────
const API_ROUTES = [
  { method: "POST", path: "/api/upload", desc: "Upload fichier(s), démarre pipeline", badge: "bg-emerald-500/20 text-emerald-300" },
  { method: "GET", path: "/api/documents", desc: "Liste paginée + filtres", badge: "bg-blue-500/20 text-blue-300" },
  { method: "GET", path: "/api/documents/{id}", desc: "Détail d'un document", badge: "bg-blue-500/20 text-blue-300" },
  { method: "GET", path: "/api/documents/{id}/status", desc: "Statut pipeline (polling)", badge: "bg-blue-500/20 text-blue-300" },
  { method: "GET", path: "/api/compliance/alerts", desc: "Liste alertes + filtres", badge: "bg-blue-500/20 text-blue-300" },
  { method: "PATCH", path: "/api/compliance/alerts/{id}", desc: "Résoudre une alerte", badge: "bg-amber-500/20 text-amber-300" },
  { method: "GET", path: "/api/suppliers", desc: "Liste fournisseurs", badge: "bg-blue-500/20 text-blue-300" },
  { method: "GET", path: "/api/suppliers/{siren}", desc: "Profil fournisseur", badge: "bg-blue-500/20 text-blue-300" },
  { method: "GET", path: "/api/stats", desc: "KPIs dashboard (7j)", badge: "bg-blue-500/20 text-blue-300" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ArchitecturePage() {
  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <motion.div {...fadeIn(0)} className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-mono mb-2">
          <Zap className="w-3 h-3" /> Architecture technique
        </div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] font-[Syne]">
          Comment fonctionne DocuSmart ?
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Plateforme de traitement intelligent de documents administratifs français. De l'upload au rapport de conformité, voici le fonctionnement complet du système.
        </p>
      </motion.div>

      {/* ── Vue globale ── */}
      <motion.div {...fadeIn(0.05)}>
        <Card>
          <SectionTitle icon={Globe} title="Vue d'ensemble" subtitle="Flux de données bout en bout" />
          <div className="overflow-x-auto pb-2">
            <div className="flex items-stretch gap-0 min-w-[700px]">
              {/* User */}
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="w-12 h-12 rounded-xl bg-slate-500/20 border border-slate-500/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs text-[var(--text-secondary)] text-center font-mono">Utilisateur</span>
                <span className="text-[10px] text-slate-500 text-center">Browser</span>
              </div>
              <div className="flex items-center"><ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" /></div>

              {/* Frontend */}
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-xs text-[var(--text-secondary)] text-center font-mono">Frontend</span>
                <span className="text-[10px] text-indigo-400 text-center">Next.js :3000</span>
              </div>
              <div className="flex items-center"><ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" /></div>

              {/* Backend */}
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Server className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs text-[var(--text-secondary)] text-center font-mono">Backend</span>
                <span className="text-[10px] text-cyan-400 text-center">FastAPI :8000</span>
              </div>
              <div className="flex items-center"><ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" /></div>

              {/* Redis */}
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-xs text-[var(--text-secondary)] text-center font-mono">Redis</span>
                <span className="text-[10px] text-rose-400 text-center">Broker :6379</span>
              </div>
              <div className="flex items-center"><ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" /></div>

              {/* Celery */}
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-xs text-[var(--text-secondary)] text-center font-mono">Celery</span>
                <span className="text-[10px] text-violet-400 text-center">4 workers</span>
              </div>
              <div className="flex items-center"><ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" /></div>

              {/* AI */}
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-xs text-[var(--text-secondary)] text-center font-mono">IA Google</span>
                <span className="text-[10px] text-yellow-400 text-center">Doc AI + Gemini</span>
              </div>
              <div className="flex items-center"><ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" /></div>

              {/* Storage */}
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs text-[var(--text-secondary)] text-center font-mono">MinIO + PG</span>
                <span className="text-[10px] text-emerald-400 text-center">Storage + BDD</span>
              </div>
            </div>
          </div>

          {/* Polling feedback */}
          <div className="mt-6 flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
            <RefreshCw className="w-4 h-4 text-indigo-400 flex-shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
            <p className="text-xs text-[var(--text-secondary)]">
              <span className="text-indigo-300 font-medium">Polling temps réel :</span> le frontend interroge{" "}
              <code className="text-cyan-300 font-mono">/api/documents/{"{id}"}/status</code> toutes les 2 secondes jusqu'au statut{" "}
              <code className="text-emerald-300 font-mono">DONE</code> ou <code className="text-rose-300 font-mono">ERROR</code>.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* ── Pipeline ── */}
      <motion.div {...fadeIn(0.1)}>
        <Card>
          <SectionTitle icon={GitBranch} title="Pipeline de traitement" subtitle="8 étapes séquentielles — tâche Celery unique" />
          <div className="space-y-3">
            {PIPELINE_STEPS.map((s, i) => (
              <div key={s.step}>
                <div className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
                  <div className="flex items-start gap-4">
                    {/* Step indicator */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${s.text}`}>{s.step}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-mono font-bold text-sm ${s.text}`}>{s.label}</span>
                        <span className="text-xs text-[var(--text-secondary)]">— {s.sublabel}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mb-2">{s.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.details.map((d) => (
                          <span key={d} className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] font-mono">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="flex justify-start ml-5 my-1">
                    <ArrowDown className="w-3 h-3 text-[var(--text-secondary)] opacity-40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Medallion Architecture ── */}
      <motion.div {...fadeIn(0.15)}>
        <Card>
          <SectionTitle icon={Layers} title="Architecture Medallion (Data Lake)" subtitle="Trois couches de transformation dans MinIO" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Bronze", emoji: "🥉", color: "border-amber-700/40 bg-amber-700/10", text: "text-amber-400",
                desc: "Données brutes immuables", bucket: "bronze/",
                items: ["Fichiers originaux PDF", "Jamais modifiés", "Base d'audit", "Conservation permanente"],
              },
              {
                label: "Silver", emoji: "🥈", color: "border-slate-400/40 bg-slate-400/10", text: "text-slate-300",
                desc: "Données nettoyées et structurées", bucket: "silver/",
                items: ["JSON extrait + OCR text", "Champs normalisés", "Entités validées", "Liées à la BDD PostgreSQL"],
              },
              {
                label: "Gold", emoji: "🥇", color: "border-yellow-500/40 bg-yellow-500/10", text: "text-yellow-300",
                desc: "Données enrichies — production", bucket: "gold/",
                items: ["Résultats fraud analysis", "Alertes associées", "Score de confiance global", "Prêtes pour reporting"],
              },
            ].map((zone) => (
              <div key={zone.label} className={`rounded-xl border ${zone.color} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{zone.emoji}</span>
                  <div>
                    <p className={`font-bold text-sm ${zone.text}`}>{zone.label}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{zone.desc}</p>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[var(--text-secondary)] mb-3 px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">
                  {zone.bucket}
                </div>
                <ul className="space-y-1">
                  {zone.items.map((item) => (
                    <li key={item} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                      <span className={`mt-0.5 ${zone.text}`}>›</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Stack technique ── */}
      <motion.div {...fadeIn(0.2)}>
        <Card>
          <SectionTitle icon={Package} title="Stack technique" subtitle="Par couche logicielle" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TECH_LAYERS.map((layer) => (
              <div key={layer.label} className={`rounded-xl border p-4 ${layer.color}`}>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mb-3 ${layer.badge}`}>
                  {layer.label}
                </span>
                <div className="space-y-2">
                  {layer.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text-primary)] font-mono">{item.name}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Modèles de données ── */}
      <motion.div {...fadeIn(0.25)}>
        <Card>
          <SectionTitle icon={Database} title="Modèles de données" subtitle="Schéma PostgreSQL — SQLAlchemy 2 async" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DATA_MODELS.map((model) => (
              <div key={model.name} className={`rounded-xl border ${model.border} bg-[var(--bg-elevated)] overflow-hidden`}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
                  <model.icon className={`w-4 h-4 ${model.color}`} />
                  <span className={`font-mono font-bold text-sm ${model.color}`}>{model.name}</span>
                </div>
                <div className="p-3 space-y-1.5">
                  {model.fields.map((f) => (
                    <div key={f.name} className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-[var(--text-primary)] w-32 truncate flex-shrink-0">{f.name}</span>
                      <span className="text-cyan-400">{f.type}</span>
                      {f.note && <span className="text-[var(--text-secondary)] ml-auto">{f.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Relations */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="text-xs text-[var(--text-secondary)]">
                <span className="text-indigo-300 font-mono">Document.supplier_siren</span> →{" "}
                <span className="text-cyan-300 font-mono">Supplier.siren</span> (FK, N:1)
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <ArrowRight className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="text-xs text-[var(--text-secondary)]">
                <span className="text-rose-300 font-mono">ComplianceAlert.document_id</span> →{" "}
                <span className="text-indigo-300 font-mono">Document.id</span> (FK, N:1)
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Types de documents ── */}
      <motion.div {...fadeIn(0.3)}>
        <Card>
          <SectionTitle icon={FileText} title="Types de documents supportés" subtitle="Classification automatique par Gemini 2.0 Flash" />
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map((t) => (
              <div key={t.code} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${t.color}`}>
                <span className="font-mono font-bold">{t.code}</span>
                <span className="opacity-70">—</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)]">
              <span className="text-violet-300 font-medium">Prompt de classification :</span> Gemini reçoit le texte OCR brut et retourne un JSON{" "}
              <code className="font-mono text-cyan-300">{`{"type": "FACTURE", "confidence": 0.97}`}</code>. Si la confiance est inférieure à 0.5, le type est marqué{" "}
              <code className="font-mono text-slate-300">INCONNU</code>.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* ── Détection de fraude ── */}
      <motion.div {...fadeIn(0.35)}>
        <Card>
          <SectionTitle icon={ShieldCheck} title="Détection de fraude & conformité" subtitle="Gemini 2.5 Pro — deux catégories de règles" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {FRAUD_RULES.map((cat) => (
              <div key={cat.category} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <cat.icon className={`w-4 h-4 ${cat.color}`} />
                  <span className={`text-sm font-bold ${cat.color}`}>{cat.category}</span>
                </div>
                <ul className="space-y-1.5">
                  {cat.rules.map((r) => (
                    <li key={r} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                      <span className={`mt-0.5 ${cat.color}`}>•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Severity levels */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { sev: "LOW", label: "Faible", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", impact: "Score -5" },
              { sev: "MEDIUM", label: "Moyen", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", impact: "Score -10" },
              { sev: "HIGH", label: "Élevé", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", impact: "Score -15" },
              { sev: "CRITICAL", label: "Critique", color: "bg-rose-500/20 text-rose-300 border-rose-500/30", impact: "Score -20" },
            ].map((s) => (
              <div key={s.sev} className={`rounded-lg border p-3 ${s.color}`}>
                <p className="font-mono font-bold text-xs">{s.sev}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{s.label}</p>
                <p className="text-[10px] font-mono mt-1 opacity-80">{s.impact}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── API Routes ── */}
      <motion.div {...fadeIn(0.4)}>
        <Card>
          <SectionTitle icon={Server} title="API REST — Endpoints" subtitle="FastAPI — OpenAPI auto-généré sur /docs" />
          <div className="space-y-2">
            {API_ROUTES.map((r) => (
              <div key={r.path} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex-shrink-0 ${r.badge} border-current`}>
                  {r.method}
                </span>
                <code className="text-xs font-mono text-[var(--text-primary)] flex-1">{r.path}</code>
                <span className="text-xs text-[var(--text-secondary)] hidden md:block">{r.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Scoring fournisseurs ── */}
      <motion.div {...fadeIn(0.45)}>
        <Card>
          <SectionTitle icon={BarChart3} title="Scoring fournisseurs" subtitle="Profil de conformité par SIREN" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Chaque fournisseur (identifié par son <span className="text-cyan-300 font-mono">SIREN</span> à 9 chiffres)
                dispose d'un <strong className="text-[var(--text-primary)]">score de conformité</strong> initialisé à <span className="text-emerald-300 font-mono">100</span>.
              </p>
              <div className="space-y-2">
                {[
                  { label: "Score initial", value: "100 / 100", bar: 100, color: "from-emerald-500 to-emerald-400" },
                  { label: "Après 1 alerte HIGH", value: "85 / 100", bar: 85, color: "from-amber-500 to-amber-400" },
                  { label: "Après 1 alerte CRITICAL", value: "65 / 100", bar: 65, color: "from-orange-500 to-orange-400" },
                  { label: "Fournisseur risqué", value: "< 50 / 100", bar: 40, color: "from-rose-500 to-rose-400" },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{item.label}</span>
                      <span className="font-mono text-[var(--text-primary)]">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.bar}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Logique de mise à jour</p>
              <div className="space-y-2">
                {[
                  { event: "Nouveau document DONE sans alerte", effect: "+0 (neutre)", color: "text-slate-400" },
                  { event: "Alerte LOW détectée", effect: "Score −5", color: "text-slate-300" },
                  { event: "Alerte MEDIUM détectée", effect: "Score −10", color: "text-amber-300" },
                  { event: "Alerte HIGH détectée", effect: "Score −15", color: "text-orange-300" },
                  { event: "Alerte CRITICAL détectée", effect: "Score −20", color: "text-rose-300" },
                  { event: "Alerte résolue manuellement", effect: "Statut RESOLVED", color: "text-emerald-300" },
                ].map((row) => (
                  <div key={row.event} className="flex items-center justify-between p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <span className="text-xs text-[var(--text-secondary)]">{row.event}</span>
                    <span className={`text-xs font-mono font-bold ${row.color}`}>{row.effect}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Footer note ── */}
      <motion.div {...fadeIn(0.5)} className="text-center pb-4">
        <p className="text-xs text-[var(--text-secondary)]">
          DocuSmart — Architecture conçue pour le Hackathon IPSSI •{" "}
          <span className="font-mono text-indigo-400">FastAPI + Next.js + Gemini + Google Document AI</span>
        </p>
      </motion.div>

    </div>
  );
}
