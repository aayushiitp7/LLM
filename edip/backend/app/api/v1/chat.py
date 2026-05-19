"""
Simple Chat API for Local RAG
"""
import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False
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
        chunks = []
        sources = []
        
        # Determine if we should query Chroma or fallback to MongoDB search
        use_chroma = CHROMA_AVAILABLE
        if use_chroma:
            try:
                chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
                collection = chroma_client.get_or_create_collection(name=settings.CHROMA_COLLECTION)
                results = collection.query(
                    query_texts=[body.query],
                    n_results=body.top_k
                )
                if results and results["documents"] and len(results["documents"]) > 0:
                    for i, doc in enumerate(results["documents"][0]):
                        chunks.append(doc)
                        metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                        sources.append({
                            "title": metadata.get("source", "Unknown"),
                            "snippet": doc[:300],
                            "confidence": metadata.get("confidence", 0.9)
                        })
            except Exception as e:
                logger.warning(f"ChromaDB failed, falling back to MongoDB: {e}")
                use_chroma = False
                
        if not use_chroma:
            # MongoDB Text search / Regex fallback
            from app.models.document import DocumentChunk, Document
            import uuid
            
            # Simple keyword search fallback
            words = [w for w in body.query.split() if len(w) > 3]
            if not words:
                words = [body.query]
            regex_query = "|".join(words)
            
            db_chunks = await DocumentChunk.find({"content": {"$regex": regex_query, "$options": "i"}}).limit(body.top_k).to_list()
            for c in db_chunks:
                chunks.append(c.content)
                doc = await Document.get(c.document_id)
                filename = doc.original_filename if doc else "Unknown"
                sources.append({
                    "title": filename,
                    "snippet": c.content[:300],
                    "confidence": 0.8
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
