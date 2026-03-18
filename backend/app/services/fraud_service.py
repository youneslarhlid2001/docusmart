import json
from typing import Any
import google.generativeai as genai
from app.config import get_settings
from app.schemas.fraud import FraudAnalysisResult, InconsistencyItem

settings = get_settings()


class FraudService:
    """Détection de fraude via Gemini 2.5 Pro (synchrone).

    Les règles d'analyse sont construites dynamiquement depuis la BDD (table fraud_rules).
    Le pipeline passe la liste des règles actives via le paramètre `active_rules`.
    """

    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.5-pro")

    def analyze(
        self,
        document: dict[str, Any],
        related_documents: list[dict[str, Any]],
        active_rules: list[dict[str, Any]] | None = None,
    ) -> FraudAnalysisResult:
        doc_summary = self._format_document(document)
        related_summary = self._format_related_documents(related_documents)

        autonomous_section = self._build_rules_section(
            [r for r in (active_rules or []) if r.get("category") == "AUTONOMOUS"],
            "RÈGLES AUTONOMES — à vérifier MÊME SANS documents liés",
        )
        cross_section = self._build_rules_section(
            [r for r in (active_rules or []) if r.get("category") == "CROSS_DOC"],
            "RÈGLES CROISÉES — nécessitent des documents liés",
        )

        prompt = f"""Tu es un expert en conformité et détection de fraude documentaire française.
Analyse ce document selon les règles configurées ci-dessous.

DOCUMENT À ANALYSER :
{doc_summary}

DOCUMENTS LIÉS DU MÊME FOURNISSEUR (pour comparaison croisée) :
{related_summary}

{autonomous_section}

{cross_section}

Si aucun document lié n'est disponible, ne vérifie que les règles autonomes.

Le champ 'type' de chaque incohérence DOIT correspondre EXACTEMENT au code entre crochets de la règle enfreinte (ex: TVA_ERROR, SIRET_MISMATCH).

Réponds UNIQUEMENT avec ce JSON (sans markdown ni explication) :
{{
  "has_inconsistencies": true,
  "inconsistencies": [
    {{
      "type": "CODE_EXACT_DE_LA_REGLE",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "description": "Description précise en français",
      "field_source": "champ_source",
      "value_source": "valeur_trouvée",
      "field_target": "champ_comparé_ou_règle",
      "value_target": "valeur_attendue"
    }}
  ],
  "overall_risk": "LOW|MEDIUM|HIGH|CRITICAL",
  "reasoning": "Explication globale en français"
}}"""

        response = self.model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        try:
            data = json.loads(text.strip())
            return FraudAnalysisResult(
                has_inconsistencies=data.get("has_inconsistencies", False),
                inconsistencies=[InconsistencyItem(**i) for i in data.get("inconsistencies", [])],
                overall_risk=data.get("overall_risk", "LOW"),
                reasoning=data.get("reasoning", ""),
            )
        except Exception:
            return FraudAnalysisResult(
                has_inconsistencies=False,
                inconsistencies=[],
                overall_risk="LOW",
                reasoning="Analyse non disponible",
            )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_rules_section(self, rules: list[dict[str, Any]], title: str) -> str:
        separator = "═" * 55
        if not rules:
            return f"{separator}\n{title}\n{separator}\n\nAucune règle active dans cette catégorie.\n"

        instructions = []
        for rule in rules:
            code = rule.get("code", "UNKNOWN_CODE")
            cj = rule.get("condition_json") or {}
            text = cj.get("prompt_instruction") or rule.get("description", rule.get("name", ""))
            instructions.append(f"[{code}] : {text}")

        return f"{separator}\n{title}\n{separator}\n\n" + "\n\n".join(instructions)

    def _format_document(self, doc: dict[str, Any]) -> str:
        lines = [f"Type: {doc.get('file_type', 'INCONNU')}", f"SIREN: {doc.get('supplier_siren', 'N/A')}"]
        for key, val in (doc.get("extracted_data") or {}).items():
            if isinstance(val, dict):
                lines.append(f"{key}: {val.get('value', 'N/A')} (conf: {val.get('confidence', 0):.0%})")
            else:
                lines.append(f"{key}: {val}")
        return "\n".join(lines)

    def _format_related_documents(self, docs: list[dict[str, Any]]) -> str:
        if not docs:
            return "Aucun document lié disponible."
        return "\n".join(f"--- Document {i} ---\n{self._format_document(d)}" for i, d in enumerate(docs[:5], 1))
