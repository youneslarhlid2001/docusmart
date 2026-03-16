from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Google AI
    google_application_credentials: str = "./credentials.json"
    google_project_id: str = ""
    document_ai_processor_id: str = ""
    document_ai_location: str = "eu"
    gemini_api_key: str = ""

    # Base de données
    database_url: str = "postgresql+asyncpg://docusmart:password@postgres:5432/docusmart"

    # Redis / Celery
    redis_url: str = "redis://redis:6379/0"

    # MinIO
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "docusmart"
    minio_secret_key: str = "docusmart123"
    minio_secure: bool = False

    # App
    secret_key: str = "change-me-in-production"
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
