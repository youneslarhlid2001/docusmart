import os
from pathlib import Path
from typing import Any
from app.config import get_settings

settings = get_settings()


class OCRService:
    """Service OCR utilisant Google Document AI (synchrone)."""

    def __init__(self):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
        from google.cloud import documentai
        self._documentai = documentai
        # Spécifier l'endpoint régional — obligatoire pour les processeurs hors US
        api_endpoint = f"{settings.document_ai_location}-documentai.googleapis.com"
        client_options = {"api_endpoint": api_endpoint}
        self.client = documentai.DocumentProcessorServiceClient(client_options=client_options)
        self.processor_name = self.client.processor_path(
            settings.google_project_id,
            settings.document_ai_location,
            settings.document_ai_processor_id,
        )

    def process_document(self, file_path: str) -> dict[str, Any]:
        """Traite un document avec Google Document AI (synchrone)."""
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

    def _detect_mime_type(self, file_path: str) -> str:
        ext = Path(file_path).suffix.lower()
        return {
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".tiff": "image/tiff",
            ".tif": "image/tiff",
        }.get(ext, "application/pdf")
