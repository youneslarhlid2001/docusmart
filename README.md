# DocuSmart — Plateforme de Traitement Automatique de Documents Administratifs

Plateforme fullstack de traitement intelligent de documents (factures, devis, attestations) avec pipeline IA complet : OCR → Classification → Extraction → Détection de fraude.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS 4, Framer Motion |
| Backend | FastAPI, Python 3.12, Pydantic v2 |
| IA | Google Document AI, Gemini 2.0 Flash, Gemini 2.5 Pro |
| Pipeline | Celery + Redis |
| Data Lake | MinIO (Architecture Medallion Bronze/Silver/Gold) |
| BDD | PostgreSQL 16 + SQLAlchemy async |
| Infra | Docker Compose |

## Architecture Medallion

```
Bronze  → Fichiers bruts uploadés (PDF/images originaux)
Silver  → Données extraites et nettoyées (JSON structuré)
Gold    → Données enrichies + résultats fraude + métadonnées
```

## Démarrage rapide

```bash
# 1. Cloner et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés API Google/Gemini

# 2. Placer vos credentials Google dans credentials.json à la racine

# 3. Lancer toute la plateforme
docker-compose up --build

# Accès :
# Frontend    → http://localhost:3000
# API         → http://localhost:8000
# API Docs    → http://localhost:8000/docs
# MinIO       → http://localhost:9001 (docusmart / docusmart123)
```

## Développement local (sans Docker)

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Migrations
alembic upgrade head

# Serveur
uvicorn app.main:app --reload --port 8000

# Worker Celery (dans un autre terminal)
celery -A app.tasks.celery_app worker --loglevel=info
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Pipeline de traitement

```
Upload PDF
    ↓
[BRONZE] Sauvegarde fichier brut → MinIO bronze-raw
    ↓
[OCR] Google Document AI → extraction texte + entités
    ↓
[CLASSIFICATION] Gemini 2.0 Flash → type document + score confiance
    ↓
[EXTRACTION] Gemini 2.0 Flash → champs structurés selon type
    ↓
[SILVER] Données propres → MinIO silver-clean + PostgreSQL
    ↓
[VÉRIFICATION] Gemini 2.5 Pro → détection incohérences / fraude
    ↓
[GOLD] Données enrichies → MinIO gold-curated + PostgreSQL
    ↓
Statut : DONE / ERROR
```

## Structure du projet

```
docusmart/
├── frontend/          # Next.js 15 + TypeScript
├── backend/           # FastAPI + Python
├── docker-compose.yml
├── .env.example
└── README.md
```

## Variables d'environnement requises

Voir `.env.example` pour la liste complète. Clés essentielles :
- `GEMINI_API_KEY` — Clé API Gemini (Google AI Studio)
- `GOOGLE_PROJECT_ID` + `DOCUMENT_AI_PROCESSOR_ID` — Pour l'OCR
- `GOOGLE_APPLICATION_CREDENTIALS` — Chemin vers le fichier credentials.json
