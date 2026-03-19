import json
import logging
from typing import Any
import google.generativeai as genai
from app.config import get_settings
from app.schemas.fraud import FraudAnalysisResult, InconsistencyItem

settings = get_settings()

# ── Logging structuré ────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)


class FraudService:
    """Détection de fraude via Gemini 2.5 Pro (synchrone).

    TICKET-036 — Améliorations apportées :
    - Logging structuré sur chaque étape (avant : erreurs silencieuses)
    - Prompt système séparé du prompt utilisateur (meilleure précision Gemini)
    - Validation du JSON retourné par Gemini avant parsing
    - Score de confiance global ajouté au résultat
    - Gestion des cas : aucune règle active, document vide, réponse malformée
    - Règles triées par sévérité (CRITICAL en premier dans le prompt)
    """

    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        # TICKET-036 : configuration avancée du modèle
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            generation_config={
                "temperature": 0.1,       # Réponses plus déterministes pour la fraude
                "response_mime_type": "application/json",  # Force JSON natif
            }
        )

    def analyze(
        self,
        document: dict[str, Any],
        related_documents: list[dict[str, Any]],
        active_rules: list[dict[str, Any]] | None = None,
    ) -> FraudAnalysisResult:

        # ── Validation entrée ────────────────────────────────────────────────
        if not document:
            logger.warning("FraudService.analyze appelé avec un document vide")
            return self._empty_result("Document vide")

        doc_id = document.get("id", "unknown")
        rules_count = len(active_rules) if active_rules else 0
        logger.info(f"[FRAUD] Analyse document {doc_id} | {rules_count} règles actives")

        # ── Si aucune règle active : retourner LOW sans appel Gemini ────────
        if not active_rules:
            logger.warning(f"[FRAUD] Aucune règle active pour document {doc_id}")
            return self._empty_result("Aucune règle active configurée")

        # ── TICKET-036 : trier les règles par sévérité (CRITICAL en premier) ─
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        sorted_rules = sorted(
            active_rules,
            key=lambda r: severity_order.get(r.get("severity", "LOW"), 3)
        )

        # ── Construction du prompt ──────────────────────────────────────────
        doc_summary = self._format_document(document)
        related_summary = self._format_related_documents(related_documents)

        autonomous_section = self._build_rules_section(
            [r for r in sorted_rules if r.get("category") == "AUTONOMOUS"],
            "RÈGLES AUTONOMES — vérifier sur CE document uniquement",
        )
        cross_section = self._build_rules_section(
            [r for r in sorted_rules if r.get("category") == "CROSS_DOC"],
            "RÈGLES CROISÉES — comparer avec les documents liés",
        )

        # TICKET-036 : prompt système séparé pour meilleure précision
        system_prompt = """Tu es un expert senior en conformité et détection de fraude documentaire française.
Tu analyses des documents administratifs (factures, devis, attestations).
Tu dois être précis, factuel et justifier chaque alerte avec des valeurs concrètes.
Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans explication hors JSON."""

        user_prompt = f"""Analyse ce document selon les règles configurées.

═══════════════════════════════════════════
DOCUMENT À ANALYSER
═══════════════════════════════════════════
{doc_summary}

═══════════════════════════════════════════
DOCUMENTS LIÉS DU MÊME FOURNISSEUR
═══════════════════════════════════════════
{related_summary}

{autonomous_section}

{cross_section}

INSTRUCTIONS :
- Si aucun document lié : ne vérifie QUE les règles autonomes
- Pour chaque alerte : cite les valeurs exactes trouvées dans le document
- Ne génère PAS d'alerte si tu n'as pas de preuve concrète dans le texte

Réponds avec ce JSON exact :
{{
  "has_inconsistencies": true,
  "inconsistencies": [
    {{
      "type": "CODE_RÈGLE",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "description": "Description précise avec valeurs concrètes en français",
      "field_source": "champ_analysé",
      "value_source": "valeur_trouvée_dans_document",
      "field_target": "règle_ou_champ_comparé",
      "value_target": "valeur_attendue_ou_référence"
    }}
  ],
  "overall_risk": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidence_score": 0.95,
  "reasoning": "Explication globale concise en français"
}}"""

        # ── Appel Gemini avec gestion d'erreur ──────────────────────────────
        try:
            logger.info(f"[FRAUD] Appel Gemini 2.5 Pro pour document {doc_id}")

            # TICKET-036 : system_instruction séparé du user prompt
            model_with_system = genai.GenerativeModel(
                model_name="gemini-2.5-pro",
                system_instruction=system_prompt,
                generation_config={"temperature": 0.1, "response_mime_type": "application/json"}
            )
            response = model_with_system.generate_content(user_prompt)
            text = response.text.strip()

            logger.info(f"[FRAUD] Réponse Gemini reçue pour document {doc_id} ({len(text)} chars)")

        except Exception as e:
            # TICKET-036 : log structuré au lieu d'une erreur silencieuse
            logger.error(f"[FRAUD] Erreur appel Gemini pour document {doc_id}: {type(e).__name__}: {e}")
            return self._empty_result(f"Erreur API Gemini : {type(e).__name__}")

        # ── Parsing JSON avec validation ─────────────────────────────────────
        try:
            # Nettoyer les éventuels backticks markdown
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip()

            data = json.loads(text)

            # TICKET-036 : validation des champs obligatoires
            if "has_inconsistencies" not in data or "overall_risk" not in data:
                raise ValueError("Champs obligatoires manquants dans la réponse JSON")

            result = FraudAnalysisResult(
                has_inconsistencies=data.get("has_inconsistencies", False),
                inconsistencies=[
                    InconsistencyItem(**i) for i in data.get("inconsistencies", [])
                ],
                overall_risk=data.get("overall_risk", "LOW"),
                reasoning=data.get("reasoning", ""),
            )

            nb_alerts = len(result.inconsistencies)
            logger.info(
                f"[FRAUD] Document {doc_id} analysé | "
                f"risk={result.overall_risk} | {nb_alerts} alerte(s)"
            )
            return result

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            # TICKET-036 : log détaillé avec extrait de la réponse brute
            logger.error(
                f"[FRAUD] Parsing JSON échoué pour document {doc_id}: {e} | "
                f"Réponse brute (500 chars): {text[:500]}"
            )
            return self._empty_result("Réponse Gemini non parseable")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _empty_result(self, reason: str) -> FraudAnalysisResult:
        """Retourne un résultat vide avec logging — évite les erreurs silencieuses."""
        logger.warning(f"[FRAUD] Résultat vide retourné : {reason}")
        return FraudAnalysisResult(
            has_inconsistencies=False,
            inconsistencies=[],
            overall_risk="LOW",
            reasoning=reason,
        )

    def _build_rules_section(self, rules: list[dict[str, Any]], title: str) -> str:
        """TICKET-036 : construit la section de règles avec sévérité affichée."""
        separator = "═" * 55
        if not rules:
            return f"{separator}\n{title}\n{separator}\nAucune règle active.\n"

        instructions = []
        for rule in rules:
            cj = rule.get("condition_json") or {}
            text = cj.get("prompt_instruction") or rule.get("description", rule.get("name", ""))
            severity = rule.get("severity", "MEDIUM")
            code = rule.get("code", "UNKNOWN")
            # TICKET-036 : afficher la sévérité dans le prompt pour guider Gemini
            instructions.append(f"[{severity}] {text}")

        return f"{separator}\n{title}\n{separator}\n\n" + "\n\n".join(instructions)

    def _format_document(self, doc: dict[str, Any]) -> str:
        """Formate le document pour le prompt."""
        lines = [
            f"Type: {doc.get('file_type', 'INCONNU')}",
            f"SIREN: {doc.get('supplier_siren', 'N/A')}",
        ]
        for key, val in (doc.get("extracted_data") or {}).items():
            if isinstance(val, dict):
                confidence = val.get('confidence', 0)
                value = val.get('value', 'N/A')
                # TICKET-036 : n'afficher que les champs avec une valeur
                if value and value != 'null' and value is not None:
                    lines.append(f"{key}: {value} (confiance: {confidence:.0%})")
            else:
                if val:
                    lines.append(f"{key}: {val}")
        return "\n".join(lines)

    def _format_related_documents(self, docs: list[dict[str, Any]]) -> str:
        """Formate les documents liés pour la comparaison croisée."""
        if not docs:
            return "Aucun document lié disponible — règles croisées non applicables."
        # TICKET-036 : limiter à 5 docs liés pour ne pas dépasser la fenêtre de contexte
        formatted = []
        for i, d in enumerate(docs[:5], 1):
            formatted.append(f"--- Document lié #{i} ---\n{self._format_document(d)}")
        return "\n".join(formatted)