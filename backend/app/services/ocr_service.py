import os
import hashlib
import logging
import json
from pathlib import Path
from typing import Any
from app.config import get_settings

settings = get_settings()

# ── Logging structuré ────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)


class OCRService:
    """Service OCR multi-moteur avec fallback automatique et cache Redis.

    TICKET-028 — Améliorations apportées :
    - Cache Redis par hash SHA-256 du fichier (TTL 7 jours)
    - Fallback automatique : Google Document AI → Tesseract local
    - Score de qualité OCR pour décider du fallback
    - Logging structuré sur chaque étape
    - Gestion d'erreur explicite par moteur
    """

    CACHE_TTL = 60 * 60 * 24 * 7  # 7 jours en secondes
    MIN_CONFIDENCE = 0.6            # Score minimum pour accepter le résultat Google

    def __init__(self):
        # ── Google Document AI ───────────────────────────────────────────────
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
        from google.cloud import documentai
        self._documentai = documentai
        api_endpoint = f"{settings.document_ai_location}-documentai.googleapis.com"
        client_options = {"api_endpoint": api_endpoint}
        self.client = documentai.DocumentProcessorServiceClient(client_options=client_options)
        self.processor_name = self.client.processor_path(
            settings.google_project_id,
            settings.document_ai_location,
            settings.document_ai_processor_id,
        )
        logger.info("[OCR] Google Document AI initialisé")

        # ── Redis cache ──────────────────────────────────────────────────────
        self._redis = None
        try:
            import redis
            self._redis = redis.from_url(settings.redis_url, decode_responses=True)
            self._redis.ping()
            logger.info("[OCR] Cache Redis connecté")
        except Exception as e:
            logger.warning(f"[OCR] Redis non disponible, cache désactivé : {e}")

        # ── Tesseract (fallback local) ───────────────────────────────────────
        self._tesseract_available = False
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            self._pytesseract = pytesseract
            self._tesseract_available = True
            logger.info("[OCR] Tesseract disponible comme fallback")
        except Exception as e:
            logger.warning(f"[OCR] Tesseract non disponible : {e}")

    # ── Point d'entrée principal ─────────────────────────────────────────────

    def process_document(self, file_path: str) -> dict[str, Any]:
        """
        Traite un document avec fallback automatique.

        Ordre :
          1. Vérifier le cache Redis (hash SHA-256)
          2. Google Document AI (moteur principal)
          3. Tesseract local si Google échoue ou confidence < MIN_CONFIDENCE
        """
        file_path_obj = Path(file_path)

        # ── Étape 1 : Cache Redis ────────────────────────────────────────────
        file_hash = self._compute_sha256(file_path)
        cache_key = f"ocr:{file_hash}"
        logger.info(f"[OCR] Traitement fichier {file_path_obj.name} | hash={file_hash[:12]}...")

        cached = self._get_cache(cache_key)
        if cached:
            logger.info(f"[OCR] Cache HIT pour {file_path_obj.name} → résultat retourné sans appel API")
            return cached

        # ── Étape 2 : Google Document AI ────────────────────────────────────
        result = None
        engine_used = None

        try:
            logger.info(f"[OCR] Appel Google Document AI pour {file_path_obj.name}")
            result = self._process_with_google(file_path)
            avg_confidence = self._compute_average_confidence(result)
            logger.info(f"[OCR] Google OK | confidence moyenne = {avg_confidence:.2f}")

            # Vérifier la qualité du résultat
            if avg_confidence < self.MIN_CONFIDENCE:
                logger.warning(
                    f"[OCR] Confidence Google trop faible ({avg_confidence:.2f} < {self.MIN_CONFIDENCE}) "
                    f"→ basculement sur Tesseract"
                )
                result = None  # Force le fallback

            else:
                engine_used = "google_document_ai"

        except Exception as e:
            logger.error(f"[OCR] Google Document AI échoué pour {file_path_obj.name} : {type(e).__name__}: {e}")
            result = None

        # ── Étape 3 : Fallback Tesseract ─────────────────────────────────────
        if result is None:
            if self._tesseract_available:
                try:
                    logger.info(f"[OCR] Fallback Tesseract pour {file_path_obj.name}")
                    result = self._process_with_tesseract(file_path)
                    engine_used = "tesseract"
                    logger.info(f"[OCR] Tesseract OK pour {file_path_obj.name}")
                except Exception as e:
                    logger.error(f"[OCR] Tesseract échoué : {type(e).__name__}: {e}")
                    result = self._empty_result(file_path, "all_engines_failed")
                    engine_used = "none"
            else:
                logger.error(f"[OCR] Aucun moteur disponible pour {file_path_obj.name}")
                result = self._empty_result(file_path, "no_engine_available")
                engine_used = "none"

        # ── Ajouter métadonnées ──────────────────────────────────────────────
        result["engine_used"] = engine_used
        result["file_hash"] = file_hash

        # ── Mettre en cache si résultat valide ───────────────────────────────
        if engine_used not in ("none", None):
            self._set_cache(cache_key, result)
            logger.info(f"[OCR] Résultat mis en cache (TTL={self.CACHE_TTL}s) | moteur={engine_used}")

        return result

    # ── Moteur 1 : Google Document AI ────────────────────────────────────────

    def _process_with_google(self, file_path: str) -> dict[str, Any]:
        """Traite le document avec Google Document AI."""
        documentai = self._documentai
        file_content = Path(file_path).read_bytes()
        mime_type = self._detect_mime_type(file_path)

        raw_document = documentai.RawDocument(content=file_content, mime_type=mime_type)
        request = documentai.ProcessRequest(name=self.processor_name, raw_document=raw_document)

        result = self.client.process_document(request=request)
        document = result.document
        full_text = document.text

        entities = []
        for entity in document.entities:
            entities.append({
                "type": entity.type_,
                "mention_text": entity.mention_text,
                "confidence": entity.confidence,
                "normalized_value": entity.normalized_value.text if entity.normalized_value else None,
            })

        pages_info = []
        for page in document.pages:
            page_data = {"page_number": page.page_number, "blocks": []}
            for block in page.blocks:
                if block.layout.text_anchor:
                    block_text = "".join(
                        full_text[s.start_index:s.end_index]
                        for s in block.layout.text_anchor.text_segments
                    )
                    page_data["blocks"].append({
                        "text": block_text.strip(),
                        "confidence": block.layout.confidence,
                    })
            pages_info.append(page_data)

        return {
            "full_text": full_text,
            "entities": entities,
            "pages": pages_info,
            "page_count": len(document.pages),
        }

    # ── Moteur 2 : Tesseract (fallback local) ─────────────────────────────────

    def _process_with_tesseract(self, file_path: str) -> dict[str, Any]:
        """Fallback OCR avec Tesseract — fonctionne 100% en local, sans API."""
        from PIL import Image
        import pdf2image

        file_ext = Path(file_path).suffix.lower()

        # Convertir PDF en images si nécessaire
        if file_ext == ".pdf":
            pages_images = pdf2image.convert_from_path(file_path, dpi=300)
        else:
            pages_images = [Image.open(file_path)]

        full_text_parts = []
        pages_info = []

        for i, image in enumerate(pages_images, 1):
            # Tesseract en français + anglais
            page_text = self._pytesseract.image_to_string(
                image,
                lang="fra+eng",
                config="--psm 6"  # Mode bloc de texte uniforme
            )

            # Récupérer les données détaillées avec scores de confiance
            data = self._pytesseract.image_to_data(
                image,
                lang="fra+eng",
                output_type=self._pytesseract.Output.DICT
            )

            # Calculer la confiance moyenne de la page
            confidences = [
                int(c) for c in data["conf"]
                if str(c).lstrip("-").isdigit() and int(c) >= 0
            ]
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

            full_text_parts.append(page_text)
            pages_info.append({
                "page_number": i,
                "blocks": [{"text": page_text.strip(), "confidence": avg_conf / 100}],
            })

        return {
            "full_text": "\n".join(full_text_parts),
            "entities": [],   # Tesseract ne fait pas d'extraction d'entités
            "pages": pages_info,
            "page_count": len(pages_images),
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _compute_sha256(self, file_path: str) -> str:
        """Calcule le hash SHA-256 du fichier pour la clé de cache."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def _compute_average_confidence(self, result: dict[str, Any]) -> float:
        """Calcule la confiance moyenne sur tous les blocs du document."""
        confidences = []
        for page in result.get("pages", []):
            for block in page.get("blocks", []):
                conf = block.get("confidence")
                if conf is not None:
                    confidences.append(float(conf))
        if not confidences:
            return 1.0  # Si pas de score, on accepte par défaut
        return sum(confidences) / len(confidences)

    def _get_cache(self, key: str) -> dict[str, Any] | None:
        """Récupère un résultat depuis le cache Redis."""
        if not self._redis:
            return None
        try:
            value = self._redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"[OCR] Erreur lecture cache Redis : {e}")
        return None

    def _set_cache(self, key: str, value: dict[str, Any]) -> None:
        """Stocke un résultat dans le cache Redis avec TTL."""
        if not self._redis:
            return
        try:
            self._redis.setex(key, self.CACHE_TTL, json.dumps(value, ensure_ascii=False))
        except Exception as e:
            logger.warning(f"[OCR] Erreur écriture cache Redis : {e}")

    def _empty_result(self, file_path: str, reason: str) -> dict[str, Any]:
        """Résultat vide en cas d'échec total de l'OCR."""
        logger.error(f"[OCR] Échec total OCR pour {Path(file_path).name} : {reason}")
        return {
            "full_text": "",
            "entities": [],
            "pages": [],
            "page_count": 0,
            "error": reason,
        }

    def _detect_mime_type(self, file_path: str) -> str:
        """Détecte le type MIME selon l'extension."""
        ext = Path(file_path).suffix.lower()
        return {
            ".pdf":  "application/pdf",
            ".png":  "image/png",
            ".jpg":  "image/jpeg",
            ".jpeg": "image/jpeg",
            ".tiff": "image/tiff",
            ".tif":  "image/tiff",
        }.get(ext, "application/pdf")