"""
Seed MongoDB with Real Data from HuggingFace Datasets
"""

import asyncio
import uuid
import structlog
from datetime import datetime, timezone
from datasets import load_dataset

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.user import User, Tenant, UserRole
from app.models.document import Document, DocumentChunk, DocumentStatus, Department, RiskLevel

logger = structlog.get_logger(__name__)

async def main():
    logger.info("seeding.start", database=settings.MONGODB_DATABASE_NAME)
    
    client = AsyncIOMotorClient(settings.MONGODB_URL, uuidRepresentation="standard")
    database = client[settings.MONGODB_DATABASE_NAME]
    
    await init_beanie(
        database=database,
        document_models=[Tenant, User, Document, DocumentChunk]
    )
    
    # 1. Create Tenant and User
    tenant = Tenant(name="Enterprise Corp", slug="enterprise")
    await tenant.insert()
    
    user = User(
        tenant_id=tenant.id,
        email="john@enterprise.com",
        username="johndoe",
        full_name="John Doe",
        hashed_password="fakehash_not_real",
        primary_role=UserRole.TENANT_ADMIN,
        is_verified=True,
        is_active=True
    )
    await user.insert()
    logger.info("seeding.user_created", email=user.email)

    # 2. Load Real Data from HuggingFace (ag_news as a proxy for business documents)
    logger.info("seeding.downloading_dataset", name="ag_news")
    dataset = load_dataset("ag_news", split="train[:50]") # Download 50 real news articles
    
    docs_to_insert = []
    chunks_to_insert = []
    
    for i, item in enumerate(dataset):
        doc = Document(
            tenant_id=tenant.id,
            original_filename=f"News_Article_{i+1}.txt",
            title=f"Article {i+1}",
            document_type="Report",
            department=Department.OPERATIONS,
            status=DocumentStatus.INDEXED,
            file_size_bytes=len(item["text"].encode('utf-8')),
            mime_type="text/plain",
            sha256_hash=f"hash_{i}",
            storage_bucket="edip-documents",
            storage_path=f"demo/News_Article_{i+1}.txt",
            page_count=1,
            chunk_count=1,
            risk_level=RiskLevel.LOW,
            indexed_at=datetime.now(timezone.utc)
        )
        docs_to_insert.append(doc)
        
        chunk = DocumentChunk(
            document_id=doc.id,
            tenant_id=tenant.id,
            chunk_index=0,
            content=item["text"],
            page_number=1,
            token_count=len(item["text"].split())
        )
        chunks_to_insert.append(chunk)

    await Document.insert_many(docs_to_insert)
    await DocumentChunk.insert_many(chunks_to_insert)
    
    logger.info("seeding.complete", documents_inserted=len(docs_to_insert))

if __name__ == "__main__":
    asyncio.run(main())
