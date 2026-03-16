"""
Règles de fraude prédéfinies.
- GENERIC / is_builtin=True  : règles natives (A1-A5, B1-B4) — reprises des règles hardcodées
- BTP                         : règles sectorielles bâtiment / travaux publics
- SANTE                       : règles sectorielles santé / médico-social
- RETAIL                      : règles sectorielles commerce / distribution
"""

BUILTIN_RULES = [
    # ── Règles autonomes ──────────────────────────────────────────────────────
    {
        "code": "TVA_ERROR",
        "name": "Erreur de calcul TVA",
        "description": "Le montant TVA doit être égal à montant_ht × tva_taux / 100 (tolérance ±0.02€).",
        "category": "AUTONOMOUS",
        "severity": "HIGH",
        "document_types": ["FACTURE"],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "A1. TVA_ERROR : montant_tva DOIT être égal à montant_ht × tva_taux / 100 (tolérance ±0.02€).\n"
                "    Si les montants extraits ne vérifient pas cette égalité → ALERTE HIGH."
            ),
        },
    },
    {
        "code": "TVA_INTRA_INVALID",
        "name": "Numéro TVA intracommunautaire invalide",
        "description": "La clé de contrôle du numéro TVA FR doit correspondre au calcul SIREN.",
        "category": "AUTONOMOUS",
        "severity": "CRITICAL",
        "document_types": ["FACTURE", "DEVIS"],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "A2. TVA_INTRA_INVALID : Pour un numéro TVA intracommunautaire français (format FRxxNNNNNNNNN) :\n"
                "    - La clé de contrôle (2 chiffres après FR) = (12 + 3 × (SIREN % 97)) % 97\n"
                "    - Les 9 derniers chiffres doivent correspondre exactement au SIREN\n"
                "    - Si le numéro TVA ne correspond pas au SIREN → ALERTE CRITICAL."
            ),
        },
    },
    {
        "code": "IBAN_SUSPICIOUS",
        "name": "IBAN suspect (séquences anormales)",
        "description": "IBAN avec des séquences répétées ou longueur non standard.",
        "category": "AUTONOMOUS",
        "severity": "HIGH",
        "document_types": ["FACTURE"],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "A3. IBAN_SUSPICIOUS : un IBAN avec des séquences répétées anormales (ex: 000000, 123456789, 999999)\n"
                "    ou un IBAN dont la longueur n'est pas standard pour le pays indiqué → ALERTE HIGH."
            ),
        },
    },
    {
        "code": "SIREN_INVALID",
        "name": "Format SIREN invalide",
        "description": "Le SIREN doit être composé de 9 chiffres exactement.",
        "category": "AUTONOMOUS",
        "severity": "CRITICAL",
        "document_types": [],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "A4. SIREN_INVALID : un SIREN valide en France est composé de 9 chiffres (0-9). "
                "Si le SIREN extrait ne fait pas exactement 9 chiffres → ALERTE CRITICAL."
            ),
        },
    },
    {
        "code": "SIRET_INVALID",
        "name": "Format SIRET invalide",
        "description": "Le SIRET doit être 14 chiffres, dont les 9 premiers correspondent au SIREN.",
        "category": "AUTONOMOUS",
        "severity": "HIGH",
        "document_types": [],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "A5. SIRET_INVALID : le SIRET doit être 14 chiffres, dont les 9 premiers correspondent au SIREN.\n"
                "    Si incohérence entre SIREN et SIRET → ALERTE HIGH."
            ),
        },
    },
    # ── Règles croisées ───────────────────────────────────────────────────────
    {
        "code": "SIRET_MISMATCH",
        "name": "SIRET différent des documents précédents",
        "description": "SIRET différent d'un document précédent du même fournisseur.",
        "category": "CROSS_DOC",
        "severity": "HIGH",
        "document_types": [],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "B1. SIRET_MISMATCH : SIRET différent d'un document précédent du même fournisseur → HIGH."
            ),
        },
    },
    {
        "code": "IBAN_CONFLICT",
        "name": "Conflit IBAN fournisseur",
        "description": "IBAN différent d'un document précédent du même fournisseur.",
        "category": "CROSS_DOC",
        "severity": "CRITICAL",
        "document_types": ["FACTURE"],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "B2. IBAN_CONFLICT : IBAN différent d'un document précédent du même fournisseur → CRITICAL."
            ),
        },
    },
    {
        "code": "DUPLICATE_INVOICE",
        "name": "Facture en doublon",
        "description": "Numéro de facture identique à un document déjà traité.",
        "category": "CROSS_DOC",
        "severity": "CRITICAL",
        "document_types": ["FACTURE"],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "B3. DUPLICATE_INVOICE : numéro de facture identique à un document déjà traité → CRITICAL."
            ),
        },
    },
    {
        "code": "AMOUNT_SUSPICIOUS",
        "name": "Montant anormalement élevé",
        "description": "Montant > 5× la moyenne des factures précédentes du même fournisseur.",
        "category": "CROSS_DOC",
        "severity": "HIGH",
        "document_types": ["FACTURE"],
        "sector": "GENERIC",
        "is_builtin": True,
        "condition_json": {
            "type": "builtin",
            "prompt_instruction": (
                "B4. AMOUNT_SUSPICIOUS : montant anormalement élevé (>5× la moyenne des factures précédentes) → HIGH."
            ),
        },
    },
]

BTP_RULES = [
    {
        "code": "BTP_ATTESTATION_URSSAF",
        "name": "Attestation URSSAF manquante (BTP)",
        "description": "Pour tout chantier BTP > 5 000€, une attestation URSSAF en cours de validité doit être jointe.",
        "category": "AUTONOMOUS",
        "severity": "HIGH",
        "document_types": ["FACTURE", "DEVIS", "BON_COMMANDE"],
        "sector": "BTP",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "BTP_ATTESTATION_URSSAF : Pour tout montant supérieur à 5 000€ dans le secteur BTP, "
                "vérifier la présence d'une référence à une attestation URSSAF valide. "
                "Si aucune attestation n'est mentionnée → ALERTE HIGH."
            ),
        },
    },
    {
        "code": "BTP_RGE_MANQUANT",
        "name": "Certification RGE absente (rénovation énergétique)",
        "description": "Les travaux de rénovation énergétique doivent être réalisés par un artisan certifié RGE.",
        "category": "AUTONOMOUS",
        "severity": "MEDIUM",
        "document_types": ["FACTURE", "DEVIS"],
        "sector": "BTP",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "BTP_RGE_MANQUANT : Si le libellé du document mentionne des travaux de rénovation énergétique "
                "(isolation, pompe à chaleur, panneaux solaires, etc.) sans référence à une certification RGE → ALERTE MEDIUM."
            ),
        },
    },
    {
        "code": "BTP_SOUS_TRAITANCE",
        "name": "Sous-traitance excessive",
        "description": "Montants de sous-traitance dépassant 30% du montant total du contrat.",
        "category": "AUTONOMOUS",
        "severity": "HIGH",
        "document_types": ["CONTRAT", "FACTURE"],
        "sector": "BTP",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "BTP_SOUS_TRAITANCE : Si le document mentionne de la sous-traitance représentant plus de 30% "
                "du montant total du contrat → ALERTE HIGH (risque de travail dissimulé)."
            ),
        },
    },
    {
        "code": "BTP_GARANTIE_DECENNALE",
        "name": "Absence de garantie décennale",
        "description": "Tout prestataire BTP doit mentionner son assurance décennale.",
        "category": "AUTONOMOUS",
        "severity": "MEDIUM",
        "document_types": ["CONTRAT", "DEVIS"],
        "sector": "BTP",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "BTP_GARANTIE_DECENNALE : Pour tout contrat ou devis BTP, vérifier la présence d'une référence "
                "à l'assurance décennale ou à la garantie décennale. Absence → ALERTE MEDIUM."
            ),
        },
    },
]

SANTE_RULES = [
    {
        "code": "SANTE_CONVENTION",
        "name": "Prestataire non conventionné",
        "description": "Le prestataire de soins doit être conventionné Sécurité Sociale.",
        "category": "AUTONOMOUS",
        "severity": "HIGH",
        "document_types": ["FACTURE"],
        "sector": "SANTE",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "SANTE_CONVENTION : Vérifier que le prestataire de soins mentionne son numéro de conventionnement "
                "Sécurité Sociale (numéro FINESS ou RPPS). Absence → ALERTE HIGH."
            ),
        },
    },
    {
        "code": "SANTE_ACTE_NOMENCLATURE",
        "name": "Acte hors nomenclature CCAM",
        "description": "Les actes médicaux facturés doivent être référencés dans la nomenclature CCAM.",
        "category": "AUTONOMOUS",
        "severity": "MEDIUM",
        "document_types": ["FACTURE"],
        "sector": "SANTE",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "SANTE_ACTE_NOMENCLATURE : Si des codes d'actes médicaux sont présents, vérifier qu'ils "
                "correspondent à des codes CCAM valides (format lettres + chiffres). Codes inconnus → ALERTE MEDIUM."
            ),
        },
    },
    {
        "code": "SANTE_DEPASSEMENT_HONORAIRES",
        "name": "Dépassement d'honoraires excessif",
        "description": "Dépassement d'honoraires supérieur à 150% du tarif conventionnel.",
        "category": "AUTONOMOUS",
        "severity": "MEDIUM",
        "document_types": ["FACTURE"],
        "sector": "SANTE",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "SANTE_DEPASSEMENT_HONORAIRES : Si un dépassement d'honoraires est mentionné et dépasse 150% "
                "du tarif de base conventionnel → ALERTE MEDIUM."
            ),
        },
    },
]

RETAIL_RULES = [
    {
        "code": "RETAIL_REMISE_EXCESSIVE",
        "name": "Remise commerciale excessive",
        "description": "Remise supérieure à 40% sans justification commerciale documentée.",
        "category": "AUTONOMOUS",
        "severity": "MEDIUM",
        "document_types": ["FACTURE", "DEVIS", "BON_COMMANDE"],
        "sector": "RETAIL",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "RETAIL_REMISE_EXCESSIVE : Si une remise ou ristourne supérieure à 40% est appliquée "
                "sans mention de justification commerciale (soldes, accord cadre, etc.) → ALERTE MEDIUM."
            ),
        },
    },
    {
        "code": "RETAIL_QUANTITE_INCOHERENTE",
        "name": "Quantités incohérentes avec l'historique",
        "description": "Quantités commandées supérieures à 10× la commande moyenne habituelle.",
        "category": "CROSS_DOC",
        "severity": "HIGH",
        "document_types": ["BON_COMMANDE", "FACTURE"],
        "sector": "RETAIL",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "RETAIL_QUANTITE_INCOHERENTE : Comparer les quantités commandées avec les documents précédents "
                "du même fournisseur. Si les quantités dépassent 10× la moyenne historique → ALERTE HIGH."
            ),
        },
    },
    {
        "code": "RETAIL_PRIX_UNITAIRE",
        "name": "Prix unitaire anormalement élevé",
        "description": "Prix unitaire d'un article supérieur à 3× le prix habituel constaté.",
        "category": "CROSS_DOC",
        "severity": "HIGH",
        "document_types": ["FACTURE", "BON_COMMANDE"],
        "sector": "RETAIL",
        "is_builtin": False,
        "condition_json": {
            "type": "custom",
            "prompt_instruction": (
                "RETAIL_PRIX_UNITAIRE : Comparer les prix unitaires avec les documents précédents du fournisseur. "
                "Si un prix dépasse 3× le prix habituel sans justification → ALERTE HIGH."
            ),
        },
    },
]

# Mapping secteur → règles
SECTOR_RULES: dict[str, list[dict]] = {
    "BTP": BTP_RULES,
    "SANTE": SANTE_RULES,
    "RETAIL": RETAIL_RULES,
}

ALL_SEEDS = BUILTIN_RULES + BTP_RULES + SANTE_RULES + RETAIL_RULES
