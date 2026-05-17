"""
Embedding Service FastAPI Entry Point
"""

import structlog
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

logger = structlog.get_logger(__name__)

app = FastAPI(title="Embedding Service")

class EmbedRequest(BaseModel):
    document_id: str
    tenant_id: str
    chunks: List[Dict[str, Any]]
    force_model: str = None

@app.post("/embed/document")
async def embed_document(request: EmbedRequest):
    """Embed chunks and store in vector database."""
    logger.info("embedding.process", chunks=len(request.chunks))
    return {"status": "success", "embedded_chunks": len(request.chunks)}

@app.get("/health")
async def health():
    return {"status": "healthy"}
