"""
Simple Chat API for Local RAG
"""
import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import chromadb
import httpx

from app.core.security import get_current_user
from app.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatQueryRequest(BaseModel):
    query: str
    top_k: int = 5

@router.post("/query")
async def rag_query(
    body: ChatQueryRequest,
    current_user=Depends(get_current_user),
):
    """Simple RAG implementation without microservices."""
    try:
        # 1. Retrieve from ChromaDB
        chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
        collection = chroma_client.get_or_create_collection(name=settings.CHROMA_COLLECTION)
        
        results = collection.query(
            query_texts=[body.query],
            n_results=body.top_k
        )
        
        chunks = []
        sources = []
        if results and results["documents"] and len(results["documents"]) > 0:
            for i, doc in enumerate(results["documents"][0]):
                chunks.append(doc)
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                sources.append({
                    "title": metadata.get("source", "Unknown"),
                    "snippet": doc[:300],
                    "confidence": metadata.get("confidence", 0.9)
                })
                
        if not chunks:
            return {
                "answer": "I couldn't find any relevant documents to answer your question.",
                "sources": []
            }

        # 2. Call OpenAI directly for generation
        context_str = "\n\n".join([f"Source {i+1}: {c}" for i, c in enumerate(chunks)])
        prompt = f"Answer the user's question based strictly on the provided context.\n\nContext:\n{context_str}\n\nQuestion: {body.query}"
        
        # Use simple HTTPX to call OpenAI API if key exists
        if settings.OPENAI_API_KEY:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.OPENAI_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                answer = data["choices"][0]["message"]["content"]
        else:
            answer = f"Local Mode Answer: Based on {len(chunks)} sources retrieved, the answer should be generated here. Please add OPENAI_API_KEY for real AI."

        return {
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during chat query.")
