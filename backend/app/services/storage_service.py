import io
import json
from datetime import date
from minio import Minio
from minio.error import S3Error
from app.config import get_settings

settings = get_settings()

# Noms des buckets par zone Medallion
BUCKET_BRONZE = "bronze-raw"
BUCKET_SILVER = "silver-clean"
BUCKET_GOLD = "gold-curated"


class StorageService:
    """
    Service de stockage MinIO implémentant l'Architecture Medallion.
    Bronze → Silver → Gold selon le niveau de transformation des données.
    """

    def __init__(self):
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self._ensure_buckets()

    def _ensure_buckets(self) -> None:
        """Crée les buckets s'ils n'existent pas encore."""
        for bucket in [BUCKET_BRONZE, BUCKET_SILVER, BUCKET_GOLD]:
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)

    def _build_path(self, doc_uuid: str, filename: str) -> str:
        """Construit le chemin : YYYY-MM-DD/{uuid}/{filename}"""
        today = date.today().isoformat()
        return f"{today}/{doc_uuid}/{filename}"

    def upload_bronze(self, file_path: str, doc_uuid: str, original_filename: str) -> str:
        """
        Zone BRONZE : stocke le fichier brut uploadé.
        Aucune transformation, conservation intégrale.
        """
        object_path = self._build_path(doc_uuid, original_filename)
        with open(file_path, "rb") as f:
            file_data = f.read()
        self.client.put_object(
            BUCKET_BRONZE,
            object_path,
            io.BytesIO(file_data),
            length=len(file_data),
        )
        return f"{BUCKET_BRONZE}/{object_path}"

    def upload_silver(self, extracted_data: dict, doc_uuid: str) -> str:
        """
        Zone SILVER : stocke les données extraites et nettoyées (JSON structuré).
        """
        object_path = self._build_path(doc_uuid, "extracted.json")
        content = json.dumps(extracted_data, ensure_ascii=False, indent=2).encode("utf-8")
        self.client.put_object(
            BUCKET_SILVER,
            object_path,
            io.BytesIO(content),
            length=len(content),
            content_type="application/json",
        )
        return f"{BUCKET_SILVER}/{object_path}"

    def upload_gold(self, curated_data: dict, doc_uuid: str) -> str:
        """
        Zone GOLD : stocke les données enrichies avec résultats fraude et métadonnées.
        """
        object_path = self._build_path(doc_uuid, "curated.json")
        content = json.dumps(curated_data, ensure_ascii=False, indent=2).encode("utf-8")
        self.client.put_object(
            BUCKET_GOLD,
            object_path,
            io.BytesIO(content),
            length=len(content),
            content_type="application/json",
        )
        return f"{BUCKET_GOLD}/{object_path}"

    def get_presigned_url(self, bucket: str, object_path: str, expires_hours: int = 1) -> str:
        """Génère une URL présignée pour accéder temporairement à un objet."""
        from datetime import timedelta
        return self.client.presigned_get_object(
            bucket, object_path, expires=timedelta(hours=expires_hours)
        )
