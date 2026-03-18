import asyncio
from pprint import pprint
import sys
import os

# Ensure the backend folder is in the path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.services.fraud_service import FraudService

async def test_fraud_service():
    service = FraudService()
    
    # Mock un document avec une erreur mathématique évidente
    doc = {
        "file_type": "FACTURE",
        "supplier_siren": "123456789",
        "extracted_data": {
            "montant_ht": {"value": 100.0, "confidence": 0.99},
            "tva_taux": {"value": 20.0, "confidence": 0.99},
            "montant_tva": {"value": 45.0, "confidence": 0.99},  # ERREUR: Devrait être 20.0
            "montant_ttc": {"value": 145.0, "confidence": 0.99}
        }
    }
    
    related_docs = []
    
    # Règle active pour la TVA
    active_rules = [
        {
            "code": "TVA_ERROR",
            "name": "Erreur de calcul TVA",
            "category": "AUTONOMOUS",
            "severity": "HIGH",
            "condition_json": {
                "prompt_instruction": (
                    "TVA_ERROR : montant_tva DOIT être égal à montant_ht × tva_taux / 100 (tolérance ±0.02€).\n"
                    "Si les montants extraits ne vérifient pas cette égalité → ALERTE HIGH."
                )
            }
        }
    ]
    
    print("MOCK - Running FraudService.analyze() ...")
    result = service.analyze(document=doc, related_documents=related_docs, active_rules=active_rules)
    
    print("\n=== RÉSULTAT DE L'ANALYSE ===")
    print(f"Has inconsistencies: {result.has_inconsistencies}")
    print(f"Overall risk: {result.overall_risk}")
    print(f"Reasoning: {result.reasoning}")
    
    print("\nInconsistencies detected:")
    success = False
    for i in result.inconsistencies:
        print(f" - TYPE: {i.type} | SEVERITY: {i.severity}")
        print(f"   Desc: {i.description}")
        if i.type == "TVA_ERROR":
            success = True
            
    if success:
        print("\n✅ SUCCÈS : Le code TVA_ERROR a bien été mappé dans le champ 'type'.")
    else:
        print("\n❌ ÉCHEC : Le code TVA_ERROR n'a pas été trouvé dans les types.")

if __name__ == "__main__":
    asyncio.run(test_fraud_service())
