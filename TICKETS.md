# DocuSmart — Board Trello

> **Projet :** Plateforme IA de traitement et détection de fraude sur documents financiers
> **Stack :** Next.js 15 · FastAPI · PostgreSQL · Celery/Redis · MinIO · Google Document AI · Gemini

---

## LEGENDE

| Label | Signification |
|-------|--------------|
| `[BE]` | Backend |
| `[FE]` | Frontend |
| `[INFRA]` | Infrastructure / DevOps |
| `[IA]` | Intelligence Artificielle / ML |
| `🔴 Critique` | Bloquant pour la prod |
| `🟠 Haute` | Priorité haute |
| `🟡 Moyenne` | Priorité moyenne |
| `🟢 Basse` | Nice-to-have |

---

---

# COLONNE 1 — DONE (Existant)

> Tout ce qui est déjà implémenté dans le codebase.

---

### TICKET-001 · [INFRA] Mise en place de l'architecture Docker

**Labels :** `[INFRA]` · `DONE`
**Effort :** M

**Description**
Orchestration complète de l'application via Docker Compose avec 6 services.

**Checklist**
- [x] Service `frontend` (Next.js, port 3000)
- [x] Service `backend` (FastAPI + Uvicorn, port 8000)
- [x] Service `celery` (worker Celery)
- [x] Service `postgres` (PostgreSQL 16)
- [x] Service `redis` (Redis 7, broker + result backend)
- [x] Service `minio` (stockage objet S3-compatible, port 9000/9001)
- [x] Réseau Docker interne entre tous les services
- [x] Variables d'environnement via `.env`

---

### TICKET-002 · [BE] Modèles de données (ORM SQLAlchemy)

**Labels :** `[BE]` · `DONE`
**Effort :** S

**Description**
Définition des 4 modèles ORM avec SQLAlchemy 2.0 async + Alembic.

**Checklist**
- [x] Modèle `Document` (UUID, filename, status, extracted_data JSONB, bronze/silver/gold paths, supplier_siren)
- [x] Modèle `ComplianceAlert` (UUID, document_id, alert_type, severity, status, description)
- [x] Modèle `FraudRule` (UUID, code, name, condition_json, severity, sector, active, is_builtin)
- [x] Modèle `Supplier` (siren PK, siret, raison_sociale, compliance_score 0-100)
- [x] Relations FK entre Document ↔ ComplianceAlert ↔ Supplier
- [x] Moteur async + moteur sync (Celery)

---

### TICKET-003 · [BE] Pipeline de traitement en 7 étapes (Celery)

**Labels :** `[BE]` `[IA]` · `DONE`
**Effort :** XL

**Description**
Pipeline asynchrone Celery qui transforme un document brut en données structurées enrichies selon l'architecture Medallion (Bronze → Silver → Gold).

**Checklist**
- [x] Étape 1 — BRONZE : sauvegarde du fichier brut dans MinIO (`bronze-raw`)
- [x] Étape 2 — OCR : extraction texte + entités via Google Document AI
- [x] Étape 3 — CLASSIFICATION : type de document + confiance via Gemini 2.0 Flash
- [x] Étape 4 — EXTRACTION : 15+ champs structurés (montant, IBAN, SIREN, TVA…) via Gemini 2.0 Flash
- [x] Étape 5 — SILVER : sauvegarde JSON nettoyé dans MinIO + PostgreSQL
- [x] Étape 6 — FRAUD DETECTION : analyse des incohérences via Gemini 2.5 Pro + règles actives
- [x] Étape 7 — GOLD : sauvegarde données enrichies + création des `ComplianceAlert`
- [x] Mise à jour du statut document à chaque étape
- [x] Gestion des erreurs avec statut `ERROR`

---

### TICKET-004 · [BE] API Upload de documents

**Labels :** `[BE]` · `DONE`
**Effort :** S

**Description**
Endpoint d'upload multi-fichiers avec déclenchement du pipeline.

**Checklist**
- [x] `POST /api/upload` — upload multi-fichiers (PDF, images)
- [x] Création d'un enregistrement `Document` par fichier
- [x] Déclenchement asynchrone du pipeline Celery
- [x] Réponse immédiate avec IDs des documents créés
- [x] `GET /api/documents/{id}/status` — polling du statut

---

### TICKET-005 · [BE] API Documents (CRUD)

**Labels :** `[BE]` · `DONE`
**Effort :** S

**Description**
CRUD complet sur les documents avec filtres et pagination.

**Checklist**
- [x] `GET /api/documents` — liste paginée avec filtres (status, type, supplier)
- [x] `GET /api/documents/{id}` — détail complet avec extracted_data
- [x] `DELETE /api/documents/{id}` — suppression
- [x] `POST /api/documents/{id}/reprocess` — relance manuelle du pipeline

---

### TICKET-006 · [BE] API Conformité & Alertes

**Labels :** `[BE]` · `DONE`
**Effort :** S

**Description**
Gestion des alertes de conformité générées par le pipeline.

**Checklist**
- [x] `GET /api/compliance/alerts` — liste avec filtres (severity, status)
- [x] `PATCH /api/compliance/alerts/{id}` — mise à jour statut (RESOLVED, FALSE_POSITIVE)
- [x] Création automatique des alertes depuis le pipeline (Gold layer)

---

### TICKET-007 · [BE] API Fournisseurs (CRM)

**Labels :** `[BE]` · `DONE`
**Effort :** S

**Description**
Gestion du référentiel fournisseurs avec scoring de conformité.

**Checklist**
- [x] `GET /api/suppliers` — liste de tous les fournisseurs
- [x] `GET /api/suppliers/{siren}` — détail fournisseur
- [x] `GET /api/suppliers/{siren}/documents` — historique documents par fournisseur
- [x] Calcul automatique du `compliance_score` (décrémenté par les alertes)
- [x] Upsert automatique du fournisseur lors du traitement d'un document

---

### TICKET-008 · [BE] API Règles de Fraude (CRUD + Seeds)

**Labels :** `[BE]` · `DONE`
**Effort :** M

**Description**
Gestion complète des règles de détection de fraude avec règles pré-définies sectorielles.

**Checklist**
- [x] `GET/POST/PUT/DELETE /api/fraud-rules` — CRUD complet
- [x] `POST /api/fraud-rules/seed/{sector}` — seeding sectoriel (BTP, SANTE, RETAIL)
- [x] 5 règles autonomes (TVA, IBAN, SIREN, format)
- [x] 4 règles cross-documents (doublon, SIRET mismatch, IBAN conflit, montant suspect)
- [x] 14 règles sectorielles (BTP, Santé, Retail)
- [x] Toggle actif/inactif par règle
- [x] Protection des règles built-in (non supprimables)

---

### TICKET-009 · [BE] API Stats & Analytics

**Labels :** `[BE]` · `DONE`
**Effort :** M

**Description**
Endpoints d'agrégation pour alimenter les dashboards.

**Checklist**
- [x] `GET /api/stats` — KPIs (total docs, taux de conformité, alertes actives, doc en traitement)
- [x] `GET /api/analytics` — métriques avancées (tendances conformité, heatmap anomalies, flux Sankey, alertes récurrentes, radar fournisseurs)

---

### TICKET-010 · [FE] Layout dashboard avec navigation

**Labels :** `[FE]` · `DONE`
**Effort :** S

**Description**
Layout principal avec sidebar de navigation et providers React.

**Checklist**
- [x] Sidebar avec liens vers toutes les pages
- [x] Provider React Query (TanStack Query v5)
- [x] Store Zustand (upload queue + filtres documents)
- [x] Client Axios (`lib/api.ts`) avec tous les endpoints
- [x] Types TypeScript partagés (`lib/types.ts`)

---

### TICKET-011 · [FE] Page Dashboard (/)

**Labels :** `[FE]` · `DONE`
**Effort :** M

**Description**
Dashboard principal avec KPIs et graphiques temps réel.

**Checklist**
- [x] 4 cartes KPI (documents, conformité, alertes, en traitement)
- [x] Graphique volumes 7 jours (Recharts BarChart)
- [x] Répartition par type de document (PieChart)
- [x] Feed des dernières alertes

---

### TICKET-012 · [FE] Page Upload (/upload)

**Labels :** `[FE]` · `DONE`
**Effort :** M

**Description**
Interface d'upload avec suivi temps réel du pipeline.

**Checklist**
- [x] Zone drag-and-drop (`DropZone`)
- [x] File queue avec statut par fichier (`FileQueue`)
- [x] Visualiseur pipeline en temps réel (`PipelineVisualizer`)
- [x] Polling HTTP toutes les 2s sur `/documents/{id}/status`
- [x] Animations Framer Motion sur les transitions d'état

---

### TICKET-013 · [FE] Page Documents (/documents)

**Labels :** `[FE]` · `DONE`
**Effort :** M

**Description**
Liste paginée de tous les documents avec filtres.

**Checklist**
- [x] Tableau/cartes de documents (`DocumentCard`)
- [x] Filtres : statut, type de document, fournisseur
- [x] Barre de recherche
- [x] Pagination
- [x] Lien vers la page détail de chaque document

---

### TICKET-014 · [FE] Page Détail Document (/document/[id])

**Labels :** `[FE]` · `DONE`
**Effort :** M

**Description**
Vue complète d'un document avec toutes les données extraites et les alertes associées.

**Checklist**
- [x] Affichage de tous les champs extraits avec scores de confiance colorés
- [x] Panel extraction (`ExtractionPanel`)
- [x] Affichage des alertes de fraude (`FraudAlert`)
- [x] Informations fournisseur associé
- [x] Statut pipeline

---

### TICKET-015 · [FE] Page Conformité (/compliance)

**Labels :** `[FE]` · `DONE`
**Effort :** M

**Description**
Gestion des alertes de conformité avec actions de résolution.

**Checklist**
- [x] Liste des alertes avec filtres (sévérité, statut)
- [x] Jauge de conformité globale
- [x] Actions : marquer comme RESOLVED ou FALSE_POSITIVE
- [x] Codes couleur par sévérité (LOW/MEDIUM/HIGH/CRITICAL)

---

### TICKET-016 · [FE] Page Analytics (/analytics)

**Labels :** `[FE]` · `DONE`
**Effort :** L

**Description**
Dashboard analytique avancé avec 6 types de visualisations.

**Checklist**
- [x] Graphique tendance conformité sur 30 jours (`ComplianceTrendChart`)
- [x] Heatmap anomalies par type × mois (`AnomalyHeatmap`)
- [x] Diagramme Sankey flux documents → alertes (`SankeyChart`)
- [x] Radar chart scores fournisseurs (`SupplierRadarChart`)
- [x] Carte alertes récurrentes (`RecurringAlertsCard`)
- [x] KPI chart traitement (`ProcessingChart`)

---

### TICKET-017 · [FE] Page CRM Fournisseurs (/crm)

**Labels :** `[FE]` · `DONE`
**Effort :** M

**Description**
Référentiel fournisseurs avec scoring et historique.

**Checklist**
- [x] Liste des fournisseurs avec compliance score
- [x] Indicateur coloré de risque fournisseur
- [x] Historique des documents par fournisseur
- [x] Nombre d'alertes par fournisseur

---

### TICKET-018 · [FE] Page Règles de Fraude (/rules)

**Labels :** `[FE]` · `DONE`
**Effort :** M

**Description**
Interface de gestion des règles de détection de fraude.

**Checklist**
- [x] Liste de toutes les règles actives/inactives
- [x] Toggle activer/désactiver par règle
- [x] Formulaire de création de règle personnalisée
- [x] Suppression des règles non built-in
- [x] Boutons de seeding sectoriel (BTP, SANTE, RETAIL)
- [x] Badges par catégorie (AUTONOMOUS / CROSS_DOC)

---

### TICKET-019 · [IA] Service OCR (Google Document AI)

**Labels :** `[IA]` `[BE]` · `DONE`
**Effort :** M

**Description**
Intégration Google Document AI pour l'extraction de texte et entités.

**Checklist**
- [x] Appel API Document AI via `google-cloud-documentai`
- [x] Extraction texte brut + entités structurées
- [x] Gestion authentification Google Cloud (service account)
- [x] Stockage résultat dans le pipeline

---

### TICKET-020 · [IA] Service Classification (Gemini 2.0 Flash)

**Labels :** `[IA]` `[BE]` · `DONE`
**Effort :** M

**Description**
Classification du type de document avec score de confiance.

**Checklist**
- [x] Prompt engineering pour classification (FACTURE, DEVIS, BON_COMMANDE, etc.)
- [x] Score de confiance retourné (0.0 à 1.0)
- [x] Fallback sur `INCONNU` si confiance < seuil

---

### TICKET-021 · [IA] Service Extraction (Gemini 2.0 Flash)

**Labels :** `[IA]` `[BE]` · `DONE`
**Effort :** M

**Description**
Extraction des champs structurés d'un document financier.

**Checklist**
- [x] 15+ champs extraits (montant HT, TTC, TVA, IBAN, SIREN, SIRET, numéro facture, date, etc.)
- [x] Score de confiance par champ
- [x] Parsing JSON de la réponse Gemini
- [x] Schéma Pydantic de validation

---

### TICKET-022 · [IA] Service Détection de Fraude (Gemini 2.5 Pro)

**Labels :** `[IA]` `[BE]` · `DONE`
**Effort :** L

**Description**
Détection d'anomalies et fraudes par analyse contextuelle avec Gemini 2.5 Pro.

**Checklist**
- [x] Récupération des règles actives depuis la BDD
- [x] Récupération des documents précédents du même fournisseur
- [x] Prompt avec contexte (document courant + historique + règles)
- [x] Parsing des incohérences détectées
- [x] Mapping vers les codes d'alertes (`TVA_ERROR`, `SIRET_MISMATCH`, etc.)

---

---

# COLONNE 2 — TO DO (Améliorations prioritaires)

---

### TICKET-023 · [BE][FE] Authentification & gestion des rôles

**Labels :** `[BE]` `[FE]` · `🔴 Critique`
**Effort :** M

**Description**
L'application est actuellement publique sans aucune protection. Toutes les données sont accessibles sans authentification.

**Acceptance Criteria**
- [ ] Login/logout fonctionnel
- [ ] JWT avec refresh tokens stockés dans Redis
- [ ] 3 rôles : `ADMIN`, `ANALYST`, `VIEWER`
- [ ] Middleware FastAPI protégeant toutes les routes
- [ ] Guard NextAuth.js côté frontend
- [ ] Multi-tenant (chaque org voit ses propres données)

**Tâches techniques**
- [ ] `[BE]` Intégrer `fastapi-users` avec JWT
- [ ] `[BE]` Ajouter `user_id`/`org_id` sur Document, Alert, FraudRule
- [ ] `[BE]` Middleware d'autorisation par rôle sur chaque route
- [ ] `[FE]` Intégrer `next-auth` avec provider credentials
- [ ] `[FE]` Page de login
- [ ] `[FE]` Redirect automatique si non connecté
- [ ] `[FE]` Affichage conditionnel selon le rôle (ex: bouton delete visible que pour ADMIN)

---

### TICKET-024 · [BE][FE] Sécurité & conformité RGPD

**Labels :** `[BE]` `[INFRA]` · `🔴 Critique`
**Effort :** L

**Description**
Les données sensibles (IBAN, SIREN, montants) sont stockées en clair dans PostgreSQL et MinIO sans politique de rétention ni traçabilité.

**Acceptance Criteria**
- [ ] Champs sensibles chiffrés dans PostgreSQL
- [ ] Chiffrement côté serveur (SSE) activé sur MinIO
- [ ] Politique de rétention configurable (N jours)
- [ ] Endpoint de suppression complète opérationnel
- [ ] Table `AuditLog` active
- [ ] IBAN/SIREN masqués dans les logs

**Tâches techniques**
- [ ] `[BE]` Activer `pgcrypto` sur les colonnes sensibles (IBAN, extracted_data)
- [ ] `[INFRA]` Configurer SSE (Server-Side Encryption) sur les buckets MinIO
- [ ] `[BE]` Tâche Celery cron de purge automatique (bronze/silver après 30j, gold après 90j)
- [ ] `[BE]` `DELETE /api/documents/{id}` : purge complète BDD + MinIO (tous layers)
- [ ] `[BE]` Créer modèle `AuditLog` (user, action, resource_id, ip, timestamp)
- [ ] `[BE]` Middleware d'audit sur toutes les routes sensibles
- [ ] `[BE]` Filtre anonymisation dans les serializers d'export

---

### TICKET-025 · [BE][FE] Temps réel via WebSocket

**Labels :** `[BE]` `[FE]` · `🟠 Haute`
**Effort :** S

**Description**
Remplacer le polling HTTP (toutes les 2s) par des WebSockets pour réduire la charge backend de ~80% et améliorer l'UX.

**Acceptance Criteria**
- [ ] Statut du pipeline mis à jour en temps réel sans polling
- [ ] Notification push pour les alertes CRITICAL
- [ ] Connexion WebSocket stable avec reconnexion automatique

**Tâches techniques**
- [ ] `[BE]` Intégrer `fastapi-socketio` ou `websockets` dans FastAPI
- [ ] `[BE]` Depuis le worker Celery : publier les updates de statut sur un channel Redis
- [ ] `[BE]` Gateway WebSocket consomme Redis et pousse au client connecté
- [ ] `[FE]` Remplacer le `setInterval` de polling par un hook `useWebSocket`
- [ ] `[FE]` Toast de notification pour les nouvelles alertes CRITICAL

---

### TICKET-026 · [FE] Interface de correction manuelle des extractions

**Labels :** `[FE]` `[BE]` · `🟠 Haute`
**Effort :** M

**Description**
Quand la confiance d'un champ extrait est < 0.7, il n'existe aucun moyen pour un opérateur de corriger la valeur. Cela génère de faux positifs.

**Acceptance Criteria**
- [ ] Vue côte-à-côte PDF + champs extraits
- [ ] Champs éditables avec indicateur de confiance coloré
- [ ] Sauvegarde de la correction en BDD
- [ ] Historique des corrections par document

**Tâches techniques**
- [ ] `[FE]` Intégrer un viewer PDF (ex: `react-pdf`)
- [ ] `[FE]` Champs input éditables sur la page `/document/[id]`
- [ ] `[FE]` Indicateur visuel confiance : rouge < 0.5, orange < 0.7, vert ≥ 0.7
- [ ] `[BE]` `PATCH /api/documents/{id}/fields` — endpoint de correction manuelle
- [ ] `[BE]` Ajouter `human_validated: bool`, `corrected_by: user_id` sur le modèle `Document`
- [ ] `[BE]` Logger les corrections dans `AuditLog`

---

### TICKET-027 · [BE][FE] Export PDF & Excel

**Labels :** `[BE]` `[FE]` · `🟡 Moyenne`
**Effort :** S

**Description**
Aucun export des données n'est disponible. Les équipes comptables ne peuvent pas travailler hors ligne.

**Acceptance Criteria**
- [ ] Export PDF d'un rapport de document
- [ ] Export Excel de la liste des documents/alertes
- [ ] Rapport de conformité mensuel généré automatiquement

**Tâches techniques**
- [ ] `[BE]` Ajouter `WeasyPrint` ou `reportlab` dans requirements
- [ ] `[BE]` `GET /api/documents/{id}/export/pdf` — rapport unitaire
- [ ] `[BE]` `GET /api/compliance/export/excel` — tableau alertes avec `openpyxl`
- [ ] `[BE]` `GET /api/suppliers/export/excel` — scoring fournisseurs
- [ ] `[BE]` Tâche Celery cron : génération rapport mensuel + envoi email
- [ ] `[FE]` Bouton "Exporter PDF" sur la page détail document
- [ ] `[FE]` Bouton "Exporter Excel" sur les pages Conformité et CRM

---

### TICKET-028 · [IA][BE] OCR multi-moteur avec fallback

**Labels :** `[IA]` `[BE]` · `🟡 Moyenne`
**Effort :** M

**Description**
L'OCR repose uniquement sur Google Document AI. Si le quota est dépassé ou l'API down, tout le pipeline s'arrête.

**Acceptance Criteria**
- [ ] Fallback automatique vers un 2e moteur si Google Document AI échoue
- [ ] Cache des résultats OCR par hash SHA-256 du fichier
- [ ] Score de qualité OCR pour déclencher une relance

**Tâches techniques**
- [ ] `[BE]` Créer une interface `OCREngine` abstraite
- [ ] `[BE]` Implémenter `AzureFormRecognizerEngine` (fallback 1)
- [ ] `[BE]` Implémenter `TesseractEngine` (fallback local 2)
- [ ] `[BE]` Logique de sélection : Google → Azure → Tesseract
- [ ] `[BE]` Cache Redis : `ocr:{sha256_hash}` → résultat OCR (TTL 7j)
- [ ] `[INFRA]` Ajouter Tesseract dans le Dockerfile backend

---

### TICKET-029 · [BE][FE] Traitement batch & files de priorité

**Labels :** `[BE]` `[FE]` · `🟢 Basse`
**Effort :** M

**Description**
Tous les documents partagent la même file Celery. Un upload de 100 fichiers bloque les documents urgents.

**Acceptance Criteria**
- [ ] 3 files distinctes : `high_priority`, `normal`, `batch`
- [ ] Endpoint d'import en masse (ZIP + CSV métadonnées)
- [ ] Estimation du temps de traitement affichée
- [ ] Pause/reprise d'un batch depuis le dashboard

**Tâches techniques**
- [ ] `[BE]` Configurer 3 queues Celery avec workers dédiés
- [ ] `[BE]` `POST /api/upload/batch` — import ZIP + CSV
- [ ] `[BE]` Modèle `Batch` (id, name, total, processed, status, created_at)
- [ ] `[BE]` `GET /api/batches/{id}` — statut du batch
- [ ] `[FE]` Page `/upload/batch` avec upload ZIP + mapping CSV
- [ ] `[FE]` Barre de progression du batch
- [ ] `[FE]` Boutons Pause / Reprendre

---

### TICKET-030 · [BE][FE] Intégrations ERP & connecteurs externes

**Labels :** `[BE]` · `🟢 Basse`
**Effort :** XL

**Description**
DocuSmart est un silo. Les données extraites ne sont pas exploitables dans les outils métier existants (ERP, GED, comptabilité).

**Acceptance Criteria**
- [ ] Webhooks sortants configurables par événement
- [ ] Import depuis Google Drive, SharePoint, emails IMAP
- [ ] Export vers Sage, Cegid (format d'import natif)

**Tâches techniques**
- [ ] `[BE]` Modèle `Webhook` (url, events, secret, active)
- [ ] `[BE]` `POST /api/webhooks` — CRUD webhooks
- [ ] `[BE]` Envoi webhook à chaque `document.processed` / `alert.created`
- [ ] `[BE]` Connecteur Google Drive (OAuth2)
- [ ] `[BE]` Connecteur IMAP (scan boîte mail, extraction pièces jointes)
- [ ] `[BE]` Générateur export Sage/Cegid (CSV formaté)
- [ ] `[FE]` Page settings `/integrations` avec gestion des webhooks

---

---

# COLONNE 3 — BUGS CONNUS / DETTE TECHNIQUE

---

### TICKET-031 · [BE] Pas de validation des types de fichiers côté backend

**Labels :** `[BE]` · `🟠 Haute`

**Description**
L'upload accepte n'importe quel fichier. Un fichier non-PDF/image peut faire planter le pipeline OCR sans message d'erreur clair.

**Fix proposé**
- [ ] Valider le `content-type` et l'extension dans `POST /api/upload`
- [ ] Retourner un `400` explicite si le type n'est pas supporté
- [ ] Liste blanche : `application/pdf`, `image/png`, `image/jpeg`, `image/tiff`

---

### TICKET-032 · [BE] Gestion d'erreur pipeline insuffisante

**Labels :** `[BE]` · `🟠 Haute`

**Description**
En cas d'erreur dans le pipeline, le statut passe à `ERROR` mais l'utilisateur ne sait pas quelle étape a échoué ni pourquoi.

**Fix proposé**
- [ ] Ajouter un champ `error_step` et `error_message` sur le modèle `Document`
- [ ] Sauvegarder l'exception à l'étape concernée
- [ ] Exposer ces infos dans `GET /api/documents/{id}`
- [ ] Afficher l'erreur sur la page détail document côté FE

---

### TICKET-033 · [FE] Polling non annulé sur unmount des composants

**Labels :** `[FE]` · `🟡 Moyenne`

**Description**
Le polling HTTP dans `PipelineVisualizer` n'est pas arrêté quand le composant est démonté, causant des mises à jour d'état sur des composants démontés (warning React).

**Fix proposé**
- [ ] Utiliser `useEffect` cleanup pour annuler le `setInterval`
- [ ] Ou migrer vers React Query avec `refetchInterval` qui gère le cleanup automatiquement

---

### TICKET-034 · [INFRA] Absence de healthchecks Docker

**Labels :** `[INFRA]` · `🟡 Moyenne`

**Description**
Aucun healthcheck Docker Compose sur les services critiques. Le backend peut démarrer avant que PostgreSQL ou Redis soit prêt.

**Fix proposé**
- [ ] Ajouter `healthcheck` sur les services `postgres` et `redis` dans `docker-compose.yml`
- [ ] Ajouter `depends_on: { postgres: { condition: service_healthy } }` sur backend et celery
- [ ] Endpoint `GET /health` sur le backend (check DB + Redis)

---

### TICKET-035 · [BE] Absence de rate limiting sur l'API

**Labels :** `[BE]` · `🟡 Moyenne`

**Description**
L'API n'a aucune limitation de débit. Un client peut envoyer des centaines de requêtes simultanées et saturer le backend ou les APIs Google.

**Fix proposé**
- [ ] Intégrer `slowapi` (rate limiter pour FastAPI)
- [ ] Limiter `POST /api/upload` à 10 fichiers/minute par IP
- [ ] Limiter toutes les routes à 100 req/minute par IP

---

---

# COLONNE 4 — BACKLOG (Idées futures)

---

### TICKET-036 · [IA] Fine-tuning des prompts via corrections humaines

**Labels :** `[IA]` · `🟢 Basse`

**Description**
Les corrections manuelles des extractions (TICKET-026) peuvent alimenter un dataset pour améliorer les prompts Gemini via few-shot learning.

**Idée**
- Exporter les paires `{texte_ocr, extraction_corrigée}` vers un bucket dédié
- Utiliser ces exemples comme few-shot dans le prompt d'extraction
- Mesurer l'impact sur le score de confiance moyen

---

### TICKET-037 · [FE] Mode sombre (Dark Mode)

**Labels :** `[FE]` · `🟢 Basse`

**Description**
L'interface est en thème clair uniquement. Un mode sombre améliorerait l'ergonomie pour une utilisation prolongée.

**Idée**
- Utiliser `next-themes` pour le toggle dark/light
- Variables CSS TailwindCSS v4 pour les couleurs

---

### TICKET-038 · [BE] API publique documentée (OpenAPI enrichi)

**Labels :** `[BE]` · `🟢 Basse`

**Description**
FastAPI génère automatiquement un Swagger/OpenAPI mais sans descriptions, exemples ou tags complets.

**Idée**
- Enrichir toutes les routes avec `summary`, `description`, `response_description`
- Ajouter des exemples de requête/réponse dans les schémas Pydantic
- Générer un SDK client TypeScript depuis l'OpenAPI avec `openapi-typescript`

---

### TICKET-039 · [INFRA] CI/CD pipeline (GitHub Actions)

**Labels :** `[INFRA]` · `🟢 Basse`

**Description**
Aucune intégration continue. Les tests et le build doivent être exécutés manuellement.

**Idée**
- Workflow GitHub Actions : lint + tests sur chaque PR
- Build et push des images Docker sur `main`
- Deploy automatique sur un VPS ou Cloud Run

---

### TICKET-040 · [BE] Tests automatisés

**Labels :** `[BE]` · `🟠 Haute`

**Description**
Aucun test unitaire ou d'intégration n'est présent dans le codebase backend.

**Idée**
- Tests unitaires sur les services (classification, extraction, fraud)
- Tests d'intégration sur les routes API avec `pytest` + `httpx`
- Utiliser les documents de test dans `/tests/sample_docs/` (10 PDFs disponibles)
- Mock des APIs Google pour les tests CI

---

## RECAPITULATIF

| # | Ticket | Priorité | Effort | Statut |
|---|--------|----------|--------|--------|
| 001 | Architecture Docker | — | M | DONE |
| 002 | Modèles ORM | — | S | DONE |
| 003 | Pipeline Celery 7 étapes | — | XL | DONE |
| 004 | API Upload | — | S | DONE |
| 005 | API Documents CRUD | — | S | DONE |
| 006 | API Conformité & Alertes | — | S | DONE |
| 007 | API Fournisseurs CRM | — | S | DONE |
| 008 | API Règles de Fraude | — | M | DONE |
| 009 | API Stats & Analytics | — | M | DONE |
| 010 | Layout & Navigation FE | — | S | DONE |
| 011 | Page Dashboard | — | M | DONE |
| 012 | Page Upload | — | M | DONE |
| 013 | Page Documents | — | M | DONE |
| 014 | Page Détail Document | — | M | DONE |
| 015 | Page Conformité | — | M | DONE |
| 016 | Page Analytics | — | L | DONE |
| 017 | Page CRM Fournisseurs | — | M | DONE |
| 018 | Page Règles de Fraude | — | M | DONE |
| 019 | Service OCR | — | M | DONE |
| 020 | Service Classification | — | M | DONE |
| 021 | Service Extraction | — | M | DONE |
| 022 | Service Détection Fraude | — | L | DONE |
| 023 | Authentification & Rôles | 🔴 Critique | M | TODO |
| 024 | Sécurité RGPD | 🔴 Critique | L | TODO |
| 025 | WebSocket temps réel | 🟠 Haute | S | TODO |
| 026 | Correction manuelle extractions | 🟠 Haute | M | TODO |
| 027 | Export PDF & Excel | 🟡 Moyenne | S | TODO |
| 028 | OCR multi-moteur fallback | 🟡 Moyenne | M | TODO |
| 029 | Batch & files de priorité | 🟢 Basse | M | TODO |
| 030 | Intégrations ERP | 🟢 Basse | XL | TODO |
| 031 | Validation types fichiers | 🟠 Haute | XS | BUG |
| 032 | Gestion erreur pipeline | 🟠 Haute | S | BUG |
| 033 | Polling unmount FE | 🟡 Moyenne | XS | BUG |
| 034 | Healthchecks Docker | 🟡 Moyenne | XS | BUG |
| 035 | Rate limiting API | 🟡 Moyenne | S | BUG |
| 036 | Fine-tuning prompts | 🟢 Basse | L | BACKLOG |
| 037 | Dark Mode | 🟢 Basse | S | BACKLOG |
| 038 | API publique OpenAPI enrichi | 🟢 Basse | S | BACKLOG |
| 039 | CI/CD GitHub Actions | 🟢 Basse | M | BACKLOG |
| 040 | Tests automatisés | 🟠 Haute | M | BACKLOG |
