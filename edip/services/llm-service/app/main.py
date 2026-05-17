"""
LLM Service FastAPI Entry Point
"""

import structlog
from fastapi import FastAPI
from pydantic import BaseModel

logger = structlog.get_logger(__name__)

app = FastAPI(title="LLM Service")

@app.get("/health")
async def health():
    return {"status": "healthy"}
