# DocuSmart — 10 Améliorations possibles

---

## 1. Authentification & gestion des utilisateurs

**Problème actuel :** L'application n'a aucun système d'authentification. N'importe qui peut accéder au dashboard et à toutes les données.

**Proposition :**
- Intégrer **NextAuth.js** (frontend) + **FastAPI-Users** (backend) avec JWT
- Rôles : `ADMIN`, `ANALYST`, `VIEWER`
- Chaque document/alerte est lié à un utilisateur ou une organisation (multi-tenant)
- Sessions persistantes avec refresh tokens stockés en Redis

**Impact :** Sécurité fondamentale, indispensable pour un déploiement en production.

---

## 2. Notifications en temps réel (WebSocket)

**Problème actuel :** Le frontend utilise du **polling HTTP** toutes les 2 secondes pour suivre le statut du pipeline. C'est inefficace et charge inutilement le backend.

**Proposition :**
- Remplacer le polling par des **WebSockets** via `fastapi-socketio` ou `channels`
- Le worker Celery pousse les mises à jour de statut directement au client connecté
- Notifications push dans le dashboard pour les nouvelles alertes CRITICAL

**Impact :** Réduction de la charge backend (~80% de requêtes en moins), UX plus fluide.

---

## 3. Export & reporting PDF/Excel

**Problème actuel :** Les données extraites et les alertes ne sont consultables que dans l'interface. Aucun export possible.

**Proposition :**
- Bouton **"Exporter"** sur les pages Documents, Conformité et CRM
- Génération de rapports PDF avec `WeasyPrint` ou `reportlab` (backend)
- Export Excel avec `openpyxl` : tableau des documents, alertes, scoring fournisseurs
- Rapport de conformité mensuel auto-généré et envoyé par email

**Impact :** Valeur métier immédiate — les équipes comptables/juridiques peuvent travailler hors ligne.

---

## 4. Moteur de règles de fraude configurable

**Problème actuel :** Les règles de détection de fraude sont **codées en dur** dans le prompt Gemini et dans le service. Impossible de les modifier sans toucher au code.

**Proposition :**
- Interface d'administration pour créer/activer/désactiver des règles de conformité
- Modèle BDD `FraudRule` : `{ name, condition_json, severity, active }`
- Éditeur de règles avec prévisualisation (ex: "Si montant > 50 000€ → alerte HIGH")
- Possibilité d'importer des règles métier sectorielles (BTP, santé, retail…)

**Impact :** Autonomie totale des équipes métier, sans dépendance aux développeurs.

---

## 5. OCR multi-moteur avec fallback

**Problème actuel :** L'OCR repose **uniquement sur Google Document AI**. Si le quota est dépassé ou si l'API est indisponible, tout le pipeline s'arrête.

**Proposition :**
- Stratégie de fallback : `Google Document AI` → `Azure Form Recognizer` → `Tesseract OCR` (local)
- Sélection automatique basée sur le type de document et la qualité estimée
- Mise en cache des résultats OCR pour éviter les double-traitements (même hash SHA-256)
- Score de qualité OCR pour déclencher une relance avec un moteur différent

**Impact :** Résilience opérationnelle, réduction des coûts API sur les documents simples.

---

## 6. Interface de correction manuelle des extractions

**Problème actuel :** Quand Gemini extrait un champ avec une faible confiance (< 0.7), il n'existe aucun moyen pour un opérateur de corriger la valeur manuellement.

**Proposition :**
- Page de révision : affiche le PDF côte à côte avec les champs extraits
- Champs éditables avec indicateur de confiance coloré (vert/orange/rouge)
- Validation humaine enregistrée en BDD (`human_validated: true`, `corrected_by: user_id`)
- Ces corrections alimentent un **dataset de fine-tuning** pour améliorer les prompts

**Impact :** Boucle d'amélioration continue, réduction des faux positifs/négatifs.

---

## 7. Traitement par lot (batch) et file de priorité

**Problème actuel :** Tous les documents sont traités dans la même file Celery avec la même priorité. Un upload de 100 fichiers bloque les documents urgents.

**Proposition :**
- Files Celery distinctes : `high_priority`, `normal`, `batch`
- API endpoint `POST /api/upload/batch` pour les imports en masse (CSV de métadonnées + ZIP)
- Estimation du temps de traitement affichée à l'utilisateur
- Pause/reprise d'un batch depuis le dashboard

**Impact :** Meilleure gestion des ressources, SLA respecté pour les documents critiques.

---

## 8. Tableau de bord analytique avancé

**Problème actuel :** Le dashboard actuel se limite à 4 KPIs et un graphique 7 jours. L'analyse des tendances est inexistante.

**Proposition :**
- Graphiques interactifs avec **Recharts** enrichi :
  - Évolution du taux de conformité par fournisseur sur 3/6/12 mois
  - Heatmap des anomalies par type de document et par mois
  - Sankey diagram : flux documents → types → alertes
- Filtres temporels personnalisables (date range picker)
- Vue comparative fournisseurs (radar chart des scores)
- Alertes récurrentes : détection automatique des fournisseurs problématiques

**Impact :** Passage d'un outil opérationnel à un vrai outil de pilotage stratégique.

---

## 9. Intégration ERP / connecteurs externes

**Problème actuel :** DocuSmart est un silo. Les données extraites ne sont pas exploitables dans les outils existants (comptabilité, ERP, GED…).

**Proposition :**
- **Webhooks sortants** : notifier un ERP externe dès qu'un document est traité (payload JSON configurable)
- **API d'import** : récupérer des documents depuis Google Drive, SharePoint, emails (IMAP)
- Connecteurs natifs : **Sage**, **Cegid**, **SAP** (export au format d'import natif)
- SDK client Python/JS pour intégrer DocuSmart dans des workflows tiers

**Impact :** Adoption massive — s'intègre dans l'écosystème existant sans remplacer les outils en place.

---

## 10. Sécurité et conformité RGPD

**Problème actuel :** Les documents contiennent des données sensibles (IBAN, SIREN, montants) stockées en clair dans PostgreSQL et MinIO, sans chiffrement ni politique de rétention.

**Proposition :**
- **Chiffrement au repos** : champs sensibles chiffrés avec `pgcrypto` (PostgreSQL) et SSE sur MinIO
- **Politique de rétention** : suppression automatique des fichiers bronze/silver après N jours (configurable)
- **Droit à l'effacement** : endpoint `DELETE /api/documents/{id}` avec purge complète (BDD + MinIO)
- **Audit log** : table `AuditLog` traçant chaque accès/modification avec IP et user
- **Anonymisation** : masquage des IBAN/SIREN dans les exports et les logs applicatifs

**Impact :** Conformité RGPD, réduction du risque juridique, confiance des clients entreprise.

---

## Récapitulatif par priorité

| # | Amélioration | Priorité | Effort | Impact |
|---|---|---|---|---|
| 1 | Authentification & rôles | 🔴 Critique | Moyen | Sécurité |
| 10 | Sécurité RGPD | 🔴 Critique | Élevé | Conformité légale |
| 2 | WebSocket temps réel | 🟠 Haute | Faible | Performance |
| 6 | Correction manuelle | 🟠 Haute | Moyen | Qualité données |
| 3 | Export PDF/Excel | 🟡 Moyenne | Faible | Valeur métier |
| 4 | Règles de fraude configurables | 🟡 Moyenne | Élevé | Autonomie métier |
| 5 | OCR multi-moteur | 🟡 Moyenne | Moyen | Résilience |
| 7 | Batch & file de priorité | 🟢 Basse | Moyen | Scalabilité |
| 8 | Dashboard analytique avancé | 🟢 Basse | Moyen | Pilotage |
| 9 | Intégrations ERP | 🟢 Basse | Élevé | Adoption |
