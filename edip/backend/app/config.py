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
    Simplified configuration for local enterprise document intelligence platform.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_NAME: str = "Enterprise Document Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = "default_secret_key_for_local_dev_only_change_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── API ────────────────────────────────────────────────────────────────
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "*"]

    # ── Database (MongoDB) ─────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb+srv://Aayush:aayush@cluster0.mgl4cpd.mongodb.net/"
    MONGODB_DATABASE_NAME: str = "edip_db"

    # ── Upload Storage (Local) ─────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"

    # ── OCR Service (Local) ────────────────────────────────────────────────
    OCR_ENGINE: str = "paddleocr"
    OCR_LANG: str = "en"
    OCR_CONFIDENCE_THRESHOLD: float = 0.7

    # ── Embedding Model (Local) ────────────────────────────────────────────
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64

    # ── Vector Database (Local Chroma) ─────────────────────────────────────
    CHROMA_DB_DIR: str = "./chroma_db"
    CHROMA_COLLECTION: str = "edip_documents"

    # ── LLM Service ────────────────────────────────────────────────────────
    LLM_PRIMARY_PROVIDER: str = "openai"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ── Security ───────────────────────────────────────────────────────────
    ENCRYPTION_KEY: str = "default_encryption_key_32_chars_long!!"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
