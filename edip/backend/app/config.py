"""
Application Configuration — Pydantic Settings v2

All settings are sourced from environment variables with full type validation.
Supports .env file loading for development.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, List, Optional

from pydantic import AnyHttpUrl, Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Production-grade application settings with environment variable sourcing,
    type validation, and sensible defaults for development.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────
    APP_ENV: str = Field("development", pattern="^(development|staging|production|test)$")
    APP_NAME: str = "Enterprise Document Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── API ────────────────────────────────────────────────────────────────
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 4
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    ALLOWED_HOSTS: List[str] = ["*"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # ── Database ───────────────────────────────────────────────────────────
    MONGODB_URL: str = Field(
        "mongodb+srv://Aayush:aayush@cluster0.mgl4cpd.mongodb.net/"
    )
    MONGODB_DATABASE_NAME: str = "edip_db"

    # ── Redis ──────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600  # seconds

    # ── Celery / RabbitMQ ──────────────────────────────────────────────────
    CELERY_BROKER_URL: str = "amqp://guest:guest@localhost:5672/"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    CELERY_TASK_ALWAYS_EAGER: bool = False  # Set True for testing
    CELERY_MAX_RETRIES: int = 3
    CELERY_RETRY_BACKOFF: int = 60  # seconds

    # ── MinIO / Object Storage ─────────────────────────────────────────────
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_DOCUMENTS: str = "edip-documents"
    MINIO_BUCKET_PROCESSED: str = "edip-processed"
    MINIO_USE_SSL: bool = False

    # ── OCR Service ────────────────────────────────────────────────────────
    OCR_SERVICE_URL: str = "http://localhost:8001"
    OCR_ENGINE: str = "paddleocr"
    OCR_LANG: str = "en"
    OCR_CONFIDENCE_THRESHOLD: float = 0.7
    OCR_MAX_PAGES: int = 500
    TESSERACT_CMD: str = "/usr/bin/tesseract"

    # ── Embedding Service ──────────────────────────────────────────────────
    EMBEDDING_SERVICE_URL: str = "http://localhost:8002"
    EMBEDDING_MODEL: str = "BAAI/bge-large-en-v1.5"
    EMBEDDING_DIMENSION: int = 1024
    EMBEDDING_BATCH_SIZE: int = 64
    EMBEDDING_CACHE_TTL: int = 86400

    # Chunking
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64
    CHUNKING_STRATEGY: str = "semantic"

    # ── Vector Database ────────────────────────────────────────────────────
    VECTOR_DB: str = Field("chroma", pattern="^(faiss|chroma|qdrant)$")
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION_DOCUMENTS: str = "edip_documents"
    FAISS_INDEX_PATH: str = "/data/faiss_indexes"
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "edip_documents"

    # ── Retrieval Service ──────────────────────────────────────────────────
    RETRIEVAL_SERVICE_URL: str = "http://localhost:8003"
    RETRIEVAL_TOP_K: int = 20
    RERANK_TOP_K: int = 5
    RETRIEVAL_STRATEGY: str = "hybrid"
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    BM25_K1: float = 1.5
    BM25_B: float = 0.75

    # ── LLM Service ────────────────────────────────────────────────────────
    LLM_SERVICE_URL: str = "http://localhost:8004"
    LLM_PRIMARY_PROVIDER: str = "openai"
    LLM_FALLBACK_PROVIDER: str = "ollama"
    LLM_MAX_TOKENS: int = 4096
    LLM_TEMPERATURE: float = 0.1
    CONFIDENCE_THRESHOLD: float = 0.7
    MAX_CONTEXT_LENGTH: int = 128000

    # LLM Provider Keys
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-pro"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    # ── Analytics Service ──────────────────────────────────────────────────
    ANALYTICS_SERVICE_URL: str = "http://localhost:8005"

    # ── Elasticsearch ──────────────────────────────────────────────────────
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_INDEX_DOCUMENTS: str = "edip_documents"
    ELASTICSEARCH_INDEX_AUDIT: str = "edip_audit"

    # ── Security ───────────────────────────────────────────────────────────
    ENCRYPTION_KEY: str = Field(..., min_length=32)
    PII_MASKING_ENABLED: bool = True
    PROMPT_INJECTION_PROTECTION: bool = True
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_FILE_TYPES: List[str] = [
        "pdf", "docx", "txt", "csv", "xlsx",
        "png", "jpg", "jpeg", "tiff", "eml", "zip"
    ]
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 100

    @field_validator("ALLOWED_FILE_TYPES", mode="before")
    @classmethod
    def parse_file_types(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [ft.strip().lower() for ft in v.split(",")]
        return v

    # ── Monitoring ─────────────────────────────────────────────────────────
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    OTEL_SERVICE_NAME: str = "edip-api"

    # ── Multi-tenancy ──────────────────────────────────────────────────────
    DEFAULT_TENANT_ID: str = "default"
    TENANT_ISOLATION: bool = True

    # ── Compliance ─────────────────────────────────────────────────────────
    DATA_RETENTION_DAYS: int = 2555      # 7 years
    AUDIT_LOG_RETENTION_DAYS: int = 3650  # 10 years
    GDPR_MODE: bool = True
    HIPAA_MODE: bool = False
    SOC2_MODE: bool = True

    # ── Email ──────────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    NOTIFICATION_FROM_EMAIL: str = "noreply@edip.internal"

    # ── Computed Properties ────────────────────────────────────────────────

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance. Thread-safe."""
    return Settings()


# Module-level singleton for convenience imports
settings = get_settings()
