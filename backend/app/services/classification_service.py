import json
from typing import Any
import google.generativeai as genai
from app.config import get_settings
from app.schemas.extraction import ClassificationResult

settings = get_settings()

DOCUMENT_TYPES = [
    "FACTURE", "DEVIS", "ATTESTATION_URSSAF", "ATTESTATION_FISCALE",
    "BON_COMMANDE", "CONTRAT", "INCONNU",
]


class ClassificationService:
    """Classification de documents via Gemini 2.0 Flash (synchrone)."""

    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def classify(self, ocr_text: str, ocr_entities: list[dict[str, Any]]) -> ClassificationResult:
        entities_summary = "\n".join(
            f"- {e['type']}: {e['mention_text']}" for e in ocr_entities[:20]
        )

        prompt = f"""Analyse ce document administratif français et classifie-le.

TEXTE DU DOCUMENT (extrait) :
{ocr_text[:3000]}

ENTITÉS DÉTECTÉES PAR OCR :
{entities_summary}

TYPES POSSIBLES : {", ".join(DOCUMENT_TYPES)}

Réponds UNIQUEMENT avec un JSON valide de cette forme exacte :
{{
  "document_type": "TYPE_PARMI_LA_LISTE",
  "confidence": 0.95,
  "justification": "Explication courte en français"
}}"""

        response = self.model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        data = json.loads(text.strip())
        return ClassificationResult(**data)
