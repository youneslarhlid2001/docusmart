"""
Générateur de documents de test pour DocuSmart.

Génère des factures, devis et attestations en PDF :
- Documents CONFORMES (pipeline normal)
- Documents FRAUDULEUX (pour déclencher les alertes)

Usage :
    pip install reportlab
    python generate_test_docs.py

Les PDFs sont créés dans ./sample_docs/
"""

import os
from datetime import date, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "sample_docs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Palette de couleurs ──────────────────────────────────────────────────────
INDIGO = colors.HexColor("#4F46E5")
LIGHT_GRAY = colors.HexColor("#F8FAFC")
MEDIUM_GRAY = colors.HexColor("#94A3B8")
DARK = colors.HexColor("#0F172A")
RED = colors.HexColor("#EF4444")
GREEN = colors.HexColor("#10B981")


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("Company", fontSize=18, textColor=INDIGO,
                               fontName="Helvetica-Bold", spaceAfter=2))
    styles.add(ParagraphStyle("SubInfo", fontSize=8, textColor=MEDIUM_GRAY,
                               fontName="Helvetica", spaceAfter=2))
    styles.add(ParagraphStyle("DocTitle", fontSize=22, textColor=DARK,
                               fontName="Helvetica-Bold", spaceAfter=6, alignment=TA_RIGHT))
    styles.add(ParagraphStyle("FieldLabel", fontSize=8, textColor=MEDIUM_GRAY,
                               fontName="Helvetica"))
    styles.add(ParagraphStyle("FieldValue", fontSize=9, textColor=DARK,
                               fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle("SectionTitle", fontSize=10, textColor=INDIGO,
                               fontName="Helvetica-Bold", spaceBefore=8, spaceAfter=4))
    styles.add(ParagraphStyle("Footer", fontSize=7, textColor=MEDIUM_GRAY,
                               fontName="Helvetica", alignment=TA_CENTER))
    styles.add(ParagraphStyle("Total", fontSize=11, textColor=DARK,
                               fontName="Helvetica-Bold", alignment=TA_RIGHT))
    styles.add(ParagraphStyle("Warning", fontSize=8, textColor=RED,
                               fontName="Helvetica-Bold"))
    return styles


def make_header(styles, emetteur: dict, destinataire: dict, doc_type: str,
                numero: str, date_emission: str, date_echeance: str = None):
    """Construit l'en-tête du document (émetteur + titre + destinataire)."""
    elements = []

    # Ligne émetteur / titre
    header_data = [
        [
            Paragraph(emetteur["nom"], styles["Company"]),
            Paragraph(doc_type, styles["DocTitle"]),
        ]
    ]
    header_table = Table(header_data, colWidths=[100*mm, 80*mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 2*mm))

    # Infos émetteur
    emetteur_lines = [
        emetteur.get("adresse", ""),
        emetteur.get("cp_ville", ""),
        f"SIREN : {emetteur.get('siren', '')}",
        f"SIRET : {emetteur.get('siret', '')}",
        f"TVA Intra : {emetteur.get('tva_intra', '')}",
        f"Tél : {emetteur.get('tel', '')}",
        f"Email : {emetteur.get('email', '')}",
    ]
    for line in emetteur_lines:
        elements.append(Paragraph(line, styles["SubInfo"]))

    elements.append(HRFlowable(width="100%", thickness=1, color=INDIGO, spaceAfter=4*mm, spaceBefore=4*mm))

    # Méta-données document + destinataire côte à côte
    meta_lines = [
        ["Numéro :", numero],
        ["Date d'émission :", date_emission],
    ]
    if date_echeance:
        meta_lines.append(["Date d'échéance :", date_echeance])

    meta_content = "\n".join(f"<b>{k}</b> {v}" for k, v in meta_lines)

    dest_lines = [
        f"<b>DESTINATAIRE</b>",
        destinataire.get("nom", ""),
        destinataire.get("adresse", ""),
        destinataire.get("cp_ville", ""),
        f"SIREN : {destinataire.get('siren', '')}",
    ]
    dest_content = "<br/>".join(dest_lines)

    info_data = [
        [Paragraph(meta_content, styles["SubInfo"]), Paragraph(dest_content, styles["SubInfo"])]
    ]
    info_table = Table(info_data, colWidths=[90*mm, 90*mm])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (0, 0), LIGHT_GRAY),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#EEF2FF")),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 6*mm))

    return elements


def make_lines_table(lignes: list[dict]):
    """Tableau des lignes de la facture/devis."""
    header = ["Description", "Qté", "Prix unitaire HT", "Total HT"]
    data = [header]
    for ligne in lignes:
        data.append([
            ligne["description"],
            str(ligne["quantite"]),
            f"{ligne['pu_ht']:.2f} €",
            f"{ligne['quantite'] * ligne['pu_ht']:.2f} €",
        ])

    table = Table(data, colWidths=[90*mm, 15*mm, 40*mm, 35*mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ("GRID", (0, 0), (-1, -1), 0.25, MEDIUM_GRAY),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return table


def make_totals(montant_ht: float, tva_taux: float, styles):
    """Bloc de totaux HT / TVA / TTC."""
    montant_tva = montant_ht * tva_taux / 100
    montant_ttc = montant_ht + montant_tva

    data = [
        ["", "Montant HT :", f"{montant_ht:.2f} €"],
        ["", f"TVA ({tva_taux:.0f}%) :", f"{montant_tva:.2f} €"],
        ["", "MONTANT TTC :", f"{montant_ttc:.2f} €"],
    ]
    table = Table(data, colWidths=[90*mm, 55*mm, 35*mm])
    table.setStyle(TableStyle([
        ("FONTNAME", (1, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (1, 2), (-1, 2), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTSIZE", (1, 2), (-1, 2), 11),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("BACKGROUND", (1, 2), (-1, 2), INDIGO),
        ("TEXTCOLOR", (1, 2), (-1, 2), colors.white),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("LINEABOVE", (1, 2), (-1, 2), 1, INDIGO),
    ]))
    return table


def make_payment_footer(iban: str, conditions: str, styles, note: str = None):
    """Pied de page avec IBAN et conditions de paiement."""
    elements = []
    elements.append(Spacer(1, 6*mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=MEDIUM_GRAY, spaceAfter=3*mm))

    pay_data = [
        [Paragraph("<b>Informations de paiement</b>", styles["FieldValue"]),
         Paragraph("<b>Conditions</b>", styles["FieldValue"])],
        [Paragraph(f"IBAN : <b>{iban}</b>", styles["SubInfo"]),
         Paragraph(conditions, styles["SubInfo"])],
    ]
    pay_table = Table(pay_data, colWidths=[100*mm, 80*mm])
    pay_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(pay_table)

    if note:
        elements.append(Spacer(1, 3*mm))
        elements.append(Paragraph(f"⚠ {note}", styles["Warning"]))

    elements.append(Spacer(1, 4*mm))
    elements.append(Paragraph(
        "Document généré pour les besoins de la démonstration DocuSmart — Hackathon 2026",
        styles["Footer"]
    ))
    return elements


# ═══════════════════════════════════════════════════════════════════════════════
# DONNÉES DE TEST
# ═══════════════════════════════════════════════════════════════════════════════

# ── Fournisseur 1 : ACME Tech (conforme) ──────────────────────────────────────
ACME = {
    "nom": "ACME Tech SAS",
    "adresse": "15 Rue de la Paix",
    "cp_ville": "75001 Paris",
    "siren": "823 456 789",
    "siret": "823 456 789 00012",
    "tva_intra": "FR 72 823456789",
    "tel": "+33 1 42 00 00 00",
    "email": "facturation@acmetech.fr",
    "iban": "FR76 3000 6000 0112 3456 7890 189",
}

# ── Fournisseur 2 : BTP Solutions (conforme) ──────────────────────────────────
BTP = {
    "nom": "BTP Solutions SARL",
    "adresse": "8 Avenue Victor Hugo",
    "cp_ville": "69002 Lyon",
    "siren": "512 874 963",
    "siret": "512 874 963 00025",
    "tva_intra": "FR 48 512874963",
    "tel": "+33 4 78 00 00 00",
    "email": "compta@btpsolutions.fr",
    "iban": "FR76 1027 8060 0000 2041 3300 045",
}

# ── Client ─────────────────────────────────────────────────────────────────────
CLIENT = {
    "nom": "Horizon Consulting SA",
    "adresse": "22 Boulevard Haussmann",
    "cp_ville": "75009 Paris",
    "siren": "751 234 567",
}

TODAY = date.today()


def generate_doc(filename: str, elements: list):
    path = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        leftMargin=15*mm,
        rightMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm,
    )
    doc.build(elements)
    print(f"  ✓ {filename}")
    return path


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENTS CONFORMES
# ═══════════════════════════════════════════════════════════════════════════════

def facture_acme_01():
    """FACTURE CONFORME — ACME Tech, développement web, janvier."""
    styles = build_styles()
    elements = []
    elements += make_header(
        styles, ACME, CLIENT,
        doc_type="FACTURE",
        numero="ACME-2026-0001",
        date_emission="15/01/2026",
        date_echeance="14/02/2026",
    )
    elements.append(Paragraph("Prestations de services", styles["SectionTitle"]))
    lignes = [
        {"description": "Développement application web — Sprint 1", "quantite": 10, "pu_ht": 850.00},
        {"description": "Intégration API REST", "quantite": 5, "pu_ht": 720.00},
        {"description": "Tests unitaires et recette", "quantite": 3, "pu_ht": 600.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 20, styles))
    elements += make_payment_footer(
        ACME["iban"], "Paiement à 30 jours fin de mois\nEscompte : néant", styles
    )
    generate_doc("01_facture_acme_conforme.pdf", elements)


def facture_acme_02():
    """FACTURE CONFORME — ACME Tech, infogérance, février."""
    styles = build_styles()
    elements = []
    elements += make_header(
        styles, ACME, CLIENT,
        doc_type="FACTURE",
        numero="ACME-2026-0002",
        date_emission="15/02/2026",
        date_echeance="17/03/2026",
    )
    elements.append(Paragraph("Forfait infogérance mensuel", styles["SectionTitle"]))
    lignes = [
        {"description": "Maintenance serveurs — Février 2026", "quantite": 1, "pu_ht": 2400.00},
        {"description": "Supervision 24/7 (30 jours)", "quantite": 30, "pu_ht": 45.00},
        {"description": "Interventions correctives (forfait)", "quantite": 1, "pu_ht": 350.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 20, styles))
    elements += make_payment_footer(
        ACME["iban"], "Paiement à 30 jours\nVirement bancaire uniquement", styles
    )
    generate_doc("02_facture_acme_conforme.pdf", elements)


def devis_btp_01():
    """DEVIS CONFORME — BTP Solutions, travaux de rénovation."""
    styles = build_styles()
    elements = []
    elements += make_header(
        styles, BTP, CLIENT,
        doc_type="DEVIS",
        numero="BTP-DEV-2026-045",
        date_emission="01/02/2026",
        date_echeance="01/03/2026",  # Validité
    )
    elements.append(Paragraph("Travaux de rénovation — Bureau 3ème étage", styles["SectionTitle"]))
    lignes = [
        {"description": "Démolition cloisons existantes", "quantite": 1, "pu_ht": 1800.00},
        {"description": "Pose cloisons sèches BA13 (m²)", "quantite": 45, "pu_ht": 85.00},
        {"description": "Peinture intérieure 2 couches (m²)", "quantite": 90, "pu_ht": 22.00},
        {"description": "Électricité — mise aux normes", "quantite": 1, "pu_ht": 3200.00},
        {"description": "Main d'œuvre (jours)", "quantite": 8, "pu_ht": 480.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 10, styles))  # TVA 10% pour travaux
    elements += make_payment_footer(
        BTP["iban"], "Devis valable 30 jours\n30% à la commande, solde à réception", styles
    )
    generate_doc("03_devis_btp_conforme.pdf", elements)


def facture_btp_01():
    """FACTURE CONFORME — BTP Solutions, suite au devis."""
    styles = build_styles()
    elements = []
    elements += make_header(
        styles, BTP, CLIENT,
        doc_type="FACTURE",
        numero="BTP-FAC-2026-112",
        date_emission="28/02/2026",
        date_echeance="30/03/2026",
    )
    elements.append(Paragraph("Travaux de rénovation — Bureau 3ème étage (réalisés)", styles["SectionTitle"]))
    lignes = [
        {"description": "Démolition cloisons existantes", "quantite": 1, "pu_ht": 1800.00},
        {"description": "Pose cloisons sèches BA13 (m²)", "quantite": 45, "pu_ht": 85.00},
        {"description": "Peinture intérieure 2 couches (m²)", "quantite": 90, "pu_ht": 22.00},
        {"description": "Électricité — mise aux normes", "quantite": 1, "pu_ht": 3200.00},
        {"description": "Main d'œuvre (jours)", "quantite": 8, "pu_ht": 480.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 10, styles))
    elements += make_payment_footer(
        BTP["iban"], "Paiement à 30 jours\nRéférence devis : BTP-DEV-2026-045", styles
    )
    generate_doc("04_facture_btp_conforme.pdf", elements)


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENTS FRAUDULEUX (erreurs intentionnelles)
# ═══════════════════════════════════════════════════════════════════════════════

def facture_acme_doublon():
    """
    FRAUDE : DUPLICATE_INVOICE
    Même numéro de facture que la facture 01 (ACME-2026-0001).
    Doit déclencher : alerte DUPLICATE_INVOICE (CRITICAL)
    """
    styles = build_styles()
    elements = []
    elements.append(Paragraph("⚠ TEST FRAUDE : Numéro de facture dupliqué", styles["Warning"]))
    elements.append(Spacer(1, 3*mm))
    elements += make_header(
        styles, ACME, CLIENT,
        doc_type="FACTURE",
        numero="ACME-2026-0001",   # ← MÊME numéro que la facture 01 !
        date_emission="20/02/2026",
        date_echeance="22/03/2026",
    )
    elements.append(Paragraph("Consulting stratégique", styles["SectionTitle"]))
    lignes = [
        {"description": "Conseil en transformation digitale", "quantite": 3, "pu_ht": 1200.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 20, styles))
    elements += make_payment_footer(
        ACME["iban"], "Paiement à 30 jours", styles,
        note="FRAUDE SIMULÉE : numéro de facture identique à ACME-2026-0001"
    )
    generate_doc("05_facture_acme_FRAUDE_doublon.pdf", elements)


def facture_acme_iban_different():
    """
    FRAUDE : IBAN_CONFLICT
    ACME Tech mais avec un IBAN différent de ses autres factures.
    Doit déclencher : alerte IBAN_CONFLICT (HIGH)
    """
    styles = build_styles()
    elements = []
    elements.append(Paragraph("⚠ TEST FRAUDE : IBAN différent des autres factures", styles["Warning"]))
    elements.append(Spacer(1, 3*mm))
    elements += make_header(
        styles, ACME, CLIENT,
        doc_type="FACTURE",
        numero="ACME-2026-0003",
        date_emission="05/03/2026",
        date_echeance="04/04/2026",
    )
    elements.append(Paragraph("Formation et accompagnement", styles["SectionTitle"]))
    lignes = [
        {"description": "Formation Next.js avancé (2 jours)", "quantite": 2, "pu_ht": 1500.00},
        {"description": "Support post-formation (1 mois)", "quantite": 1, "pu_ht": 800.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 20, styles))
    elements += make_payment_footer(
        "FR76 4255 9100 0008 0235 6741 021",  # ← IBAN DIFFÉRENT !
        "Paiement immédiat requis", styles,
        note="FRAUDE SIMULÉE : IBAN différent de FR76 3000 6000 0112 3456 7890 189"
    )
    generate_doc("06_facture_acme_FRAUDE_iban_different.pdf", elements)


def facture_btp_tva_incorrecte():
    """
    FRAUDE : TVA_ERROR
    Montant TVA calculé incorrectement (affiché 8% mais taux déclaré 20%).
    Doit déclencher : alerte TVA_ERROR (HIGH)
    """
    styles = build_styles()
    elements = []
    elements.append(Paragraph("⚠ TEST FRAUDE : Montant TVA incorrect", styles["Warning"]))
    elements.append(Spacer(1, 3*mm))
    elements += make_header(
        styles, BTP, CLIENT,
        doc_type="FACTURE",
        numero="BTP-FAC-2026-125",
        date_emission="10/03/2026",
        date_echeance="09/04/2026",
    )
    elements.append(Paragraph("Installation climatisation", styles["SectionTitle"]))
    lignes = [
        {"description": "Fourniture et pose climatisation inverter", "quantite": 3, "pu_ht": 2200.00},
        {"description": "Raccordement électrique", "quantite": 1, "pu_ht": 650.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))

    # Calcul intentionnellement faux : HT=7250, TVA affichée=580 (8%) au lieu de 1450 (20%)
    ht = 7250.0
    tva_affichee = 580.0   # ← FAUX (devrait être 1450 pour 20%)
    ttc = ht + tva_affichee

    totals_data = [
        ["", "Montant HT :", f"{ht:.2f} €"],
        ["", "TVA (20%) :", f"{tva_affichee:.2f} €"],   # Taux déclaré 20%, montant incorrect
        ["", "MONTANT TTC :", f"{ttc:.2f} €"],
    ]
    totals_table = Table(totals_data, colWidths=[90*mm, 55*mm, 35*mm])
    totals_table.setStyle(TableStyle([
        ("FONTNAME", (1, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (1, 2), (-1, 2), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("BACKGROUND", (1, 2), (-1, 2), RED),
        ("TEXTCOLOR", (1, 2), (-1, 2), colors.white),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(totals_table)
    elements += make_payment_footer(
        BTP["iban"], "Paiement à 30 jours", styles,
        note="FRAUDE SIMULÉE : TVA déclarée 20% mais montant = 580€ au lieu de 1450€"
    )
    generate_doc("07_facture_btp_FRAUDE_tva_incorrecte.pdf", elements)


def facture_btp_siret_different():
    """
    FRAUDE : SIRET_MISMATCH
    BTP Solutions avec un SIRET différent de celui habituel.
    Doit déclencher : alerte SIRET_MISMATCH (CRITICAL)
    """
    btp_frauduleux = {**BTP, "siret": "512 874 963 00099"}  # ← SIRET DIFFÉRENT !
    styles = build_styles()
    elements = []
    elements.append(Paragraph("⚠ TEST FRAUDE : SIRET différent des autres documents", styles["Warning"]))
    elements.append(Spacer(1, 3*mm))
    elements += make_header(
        styles, btp_frauduleux, CLIENT,
        doc_type="FACTURE",
        numero="BTP-FAC-2026-130",
        date_emission="15/03/2026",
        date_echeance="14/04/2026",
    )
    elements.append(Paragraph("Nettoyage et entretien locaux", styles["SectionTitle"]))
    lignes = [
        {"description": "Nettoyage bureaux (forfait mensuel)", "quantite": 1, "pu_ht": 1200.00},
        {"description": "Produits d'entretien", "quantite": 1, "pu_ht": 180.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 20, styles))
    elements += make_payment_footer(
        BTP["iban"], "Paiement à 30 jours", styles,
        note="FRAUDE SIMULÉE : SIRET 512 874 963 00099 au lieu de 512 874 963 00025"
    )
    generate_doc("08_facture_btp_FRAUDE_siret_different.pdf", elements)


def facture_acme_tva_intra_invalide():
    """
    FRAUDE : TVA_INTRA_INVALID
    Numéro TVA intracommunautaire qui ne correspond pas au SIREN.
    Doit déclencher : alerte TVA_INTRA_INVALID (HIGH)
    """
    acme_frauduleux = {**ACME, "tva_intra": "FR 99 999999999"}  # ← TVA INTRA INVALIDE
    styles = build_styles()
    elements = []
    elements.append(Paragraph("⚠ TEST FRAUDE : Numéro TVA intracommunautaire invalide", styles["Warning"]))
    elements.append(Spacer(1, 3*mm))
    elements += make_header(
        styles, acme_frauduleux, CLIENT,
        doc_type="FACTURE",
        numero="ACME-2026-0004",
        date_emission="20/03/2026",
        date_echeance="19/04/2026",
    )
    elements.append(Paragraph("Audit de sécurité informatique", styles["SectionTitle"]))
    lignes = [
        {"description": "Audit pentest applicatif", "quantite": 1, "pu_ht": 4500.00},
        {"description": "Rapport d'audit détaillé", "quantite": 1, "pu_ht": 800.00},
        {"description": "Réunion de restitution", "quantite": 2, "pu_ht": 350.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 20, styles))
    elements += make_payment_footer(
        ACME["iban"], "Paiement à 45 jours", styles,
        note="FRAUDE SIMULÉE : TVA Intra FR 99 999999999 ne correspond pas au SIREN 823456789"
    )
    generate_doc("09_facture_acme_FRAUDE_tva_intra_invalide.pdf", elements)


def facture_montant_suspect():
    """
    FRAUDE : AMOUNT_SUSPICIOUS
    Facture ACME avec un montant anormalement élevé (x10 vs historique).
    Doit déclencher : alerte AMOUNT_SUSPICIOUS (MEDIUM)
    """
    styles = build_styles()
    elements = []
    elements.append(Paragraph("⚠ TEST FRAUDE : Montant anormalement élevé", styles["Warning"]))
    elements.append(Spacer(1, 3*mm))
    elements += make_header(
        styles, ACME, CLIENT,
        doc_type="FACTURE",
        numero="ACME-2026-0005",
        date_emission="25/03/2026",
        date_echeance="24/04/2026",
    )
    elements.append(Paragraph("Projet transformation digitale — Phase 2", styles["SectionTitle"]))
    lignes = [
        {"description": "Architecture système cloud enterprise", "quantite": 1, "pu_ht": 45000.00},
        {"description": "Migration base de données (200 tables)", "quantite": 1, "pu_ht": 28000.00},
        {"description": "Formation équipe (10 personnes)", "quantite": 10, "pu_ht": 2500.00},
        {"description": "Accompagnement change management", "quantite": 1, "pu_ht": 12000.00},
    ]
    elements.append(make_lines_table(lignes))
    elements.append(Spacer(1, 4*mm))
    ht = sum(l["quantite"] * l["pu_ht"] for l in lignes)
    elements.append(make_totals(ht, 20, styles))
    elements += make_payment_footer(
        ACME["iban"], "Paiement à 60 jours fin de mois", styles,
        note="FRAUDE SIMULÉE : montant 110 000€ HT anormalement élevé vs historique ~5 000€ HT"
    )
    generate_doc("10_facture_acme_FRAUDE_montant_suspect.pdf", elements)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"\n🗂  Génération des documents de test dans : {OUTPUT_DIR}\n")

    print("── Documents CONFORMES ──────────────────────────────")
    facture_acme_01()
    facture_acme_02()
    devis_btp_01()
    facture_btp_01()

    print("\n── Documents FRAUDULEUX ─────────────────────────────")
    facture_acme_doublon()
    facture_acme_iban_different()
    facture_btp_tva_incorrecte()
    facture_btp_siret_different()
    facture_acme_tva_intra_invalide()
    facture_montant_suspect()

    print(f"\n✅ 10 documents générés dans {OUTPUT_DIR}/")
    print("\nOrdre d'upload recommandé pour la démo :")
    print("  1. Upload les 4 conformes en premier (pour créer l'historique fournisseur)")
    print("  2. Upload les 6 frauduleux → les alertes se déclenchent par comparaison")
