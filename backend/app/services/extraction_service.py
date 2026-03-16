import json
from typing import Any
import google.generativeai as genai
from app.config import get_settings

settings = get_settings()

EXTRACTION_PROMPTS = {
    "FACTURE": """Extrais les informations suivantes de cette facture française.
Pour chaque champ, donne la valeur et un score de confiance entre 0.0 et 1.0.
Réponds UNIQUEMENT avec ce JSON :
{
  "siren": {"value": "...", "confidence": 0.9},
  "siret": {"value": "...", "confidence": 0.9},
  "numero_facture": {"value": "...", "confidence": 0.9},
  "date_emission": {"value": "JJ/MM/AAAA", "confidence": 0.9},
  "date_echeance": {"value": "JJ/MM/AAAA ou null", "confidence": 0.9},
  "emetteur": {"value": "...", "confidence": 0.9},
  "destinataire": {"value": "...", "confidence": 0.9},
  "montant_ht": {"value": "0.00", "confidence": 0.9},
  "tva_taux": {"value": "20", "confidence": 0.9},
  "montant_tva": {"value": "0.00", "confidence": 0.9},
  "montant_ttc": {"value": "0.00", "confidence": 0.9},
  "numero_tva_intra": {"value": "...", "confidence": 0.9},
  "iban": {"value": "...", "confidence": 0.9},
  "conditions_paiement": {"value": "...", "confidence": 0.9}
}
Si un champ est absent, mets value à null et confidence à 0.0.""",

    "DEVIS": """Extrais les informations suivantes de ce devis.
Réponds UNIQUEMENT avec ce JSON :
{
  "siren": {"value": "...", "confidence": 0.9},
  "siret": {"value": "...", "confidence": 0.9},
  "numero_devis": {"value": "...", "confidence": 0.9},
  "date_devis": {"value": "JJ/MM/AAAA", "confidence": 0.9},
  "validite": {"value": "...", "confidence": 0.9},
  "emetteur": {"value": "...", "confidence": 0.9},
  "destinataire": {"value": "...", "confidence": 0.9},
  "montant_ht": {"value": "0.00", "confidence": 0.9},
  "montant_ttc": {"value": "0.00", "confidence": 0.9},
  "postes": []
}""",

    "ATTESTATION_URSSAF": """Extrais les informations de cette attestation URSSAF.
Réponds UNIQUEMENT avec ce JSON :
{
  "type_attestation": {"value": "URSSAF", "confidence": 1.0},
  "siren": {"value": "...", "confidence": 0.9},
  "siret": {"value": "...", "confidence": 0.9},
  "raison_sociale": {"value": "...", "confidence": 0.9},
  "periode_validite": {"value": "...", "confidence": 0.9},
  "date_emission": {"value": "JJ/MM/AAAA", "confidence": 0.9},
  "organisme_emetteur": {"value": "URSSAF", "confidence": 1.0},
  "statut": {"value": "EN RÈGLE ou NON EN RÈGLE", "confidence": 0.9}
}""",

    "ATTESTATION_FISCALE": """Extrais les informations de cette attestation fiscale.
Réponds UNIQUEMENT avec ce JSON :
{
  "type_attestation": {"value": "FISCALE", "confidence": 1.0},
  "siren": {"value": "...", "confidence": 0.9},
  "siret": {"value": "...", "confidence": 0.9},
  "raison_sociale": {"value": "...", "confidence": 0.9},
  "periode_validite": {"value": "...", "confidence": 0.9},
  "date_emission": {"value": "JJ/MM/AAAA", "confidence": 0.9},
  "organisme_emetteur": {"value": "DGFiP", "confidence": 0.9},
  "statut": {"value": "...", "confidence": 0.9}
}""",
}

DEFAULT_PROMPT = """Extrais les informations clés de ce document.
Réponds UNIQUEMENT avec un JSON contenant les champs trouvés,
chacun sous la forme {"value": "...", "confidence": 0.0-1.0}."""


class ExtractionService:
    """Extraction de champs structurés via Gemini 2.0 Flash (synchrone)."""

    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def extract(self, ocr_text: str, document_type: str) -> dict[str, Any]:
        extraction_prompt = EXTRACTION_PROMPTS.get(document_type, DEFAULT_PROMPT)
        prompt = f"""{extraction_prompt}

TEXTE DU DOCUMENT :
{ocr_text[:4000]}"""

        response = self.model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            return {"error": "extraction_failed", "raw_response": text[:500]}
