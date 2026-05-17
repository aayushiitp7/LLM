"""
OCR Microservice — Main Entry Point

FastAPI service exposing OCR capabilities:
- POST /ocr/process — Process a document from MinIO
- POST /ocr/image — Process a raw image (base64)
- GET  /ocr/status/{task_id} — Get async OCR task status
- GET  /ocr/health — Service health

Uses PaddleOCR as primary engine, Tesseract as fallback.
Ensemble mode runs both and selects highest-confidence result.
"""

from __future__ import annotations

import base64
import io
import os
import time
import uuid
from typing import List, Optional

import structlog
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from prometheus_fastapi_instrumentator import Instrumentator

from app.engines.ensemble import EnsembleOCREngine
from app.engines.paddleocr_engine import PaddleOCREngine
from app.engines.tesseract_engine import TesseractOCREngine
from app.models import OCRRequest, OCRResponse, OCRPageResult
from app.preprocessing.pipeline import ImagePreprocessingPipeline
from app.extractors.table_extractor import TableExtractor
from app.extractors.form_extractor import FormExtractor

logger = structlog.get_logger(__name__)

app = FastAPI(
    title="EDIP OCR Service",
    description="Enterprise OCR microservice with PaddleOCR + Tesseract ensemble",
    version="1.0.0",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
Instrumentator().instrument(app).expose(app)

# ─── Engine Initialization ─────────────────────────────────────────────────

_ocr_engine: Optional[EnsembleOCREngine] = None
_preprocessor: Optional[ImagePreprocessingPipeline] = None
_table_extractor: Optional[TableExtractor] = None
_form_extractor: Optional[FormExtractor] = None


@app.on_event("startup")
async def startup():
    global _ocr_engine, _preprocessor, _table_extractor, _form_extractor

    logger.info("ocr_service.initializing_engines")

    _preprocessor = ImagePreprocessingPipeline()
    _table_extractor = TableExtractor()
    _form_extractor = FormExtractor()

    engine_name = os.getenv("OCR_ENGINE", "ensemble")

    if engine_name == "paddleocr":
        _ocr_engine = PaddleOCREngine()
    elif engine_name == "tesseract":
        _ocr_engine = TesseractOCREngine()
    else:
        # Ensemble: try PaddleOCR first, fall back to Tesseract
        paddle_engine = PaddleOCREngine()
        tesseract_engine = TesseractOCREngine()
        _ocr_engine = EnsembleOCREngine(
            primary=paddle_engine,
            fallback=tesseract_engine,
            confidence_threshold=float(os.getenv("OCR_CONFIDENCE_THRESHOLD", "0.7")),
        )

    logger.info("ocr_service.engines_ready", engine=engine_name)


# ─── Request / Response Models ─────────────────────────────────────────────

class ProcessDocumentRequest(BaseModel):
    document_id: str
    storage_path: str
    storage_bucket: str
    language: str = "en"
    engine: str = "ensemble"
    extract_tables: bool = True
    extract_forms: bool = True
    detect_handwriting: bool = True
    detect_signatures: bool = True


class ProcessImageRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image")
    language: str = "en"
    extract_tables: bool = True


class WordBoundingBox(BaseModel):
    text: str
    confidence: float
    bbox: List[List[float]]  # [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]


class TableCell(BaseModel):
    row: int
    col: int
    text: str
    bbox: Optional[List[float]] = None


class ExtractedTable(BaseModel):
    table_index: int
    rows: int
    cols: int
    cells: List[TableCell]
    raw_html: Optional[str] = None
    confidence: float


class OCRPageResult(BaseModel):
    page_number: int
    raw_text: str
    word_count: int
    confidence_score: float
    bounding_boxes: List[WordBoundingBox]
    tables: List[ExtractedTable]
    has_handwriting: bool
    has_signatures: bool
    is_rotated: bool
    rotation_angle: float
    page_width: float
    page_height: float
    processing_time_ms: int
    engine_used: str


class OCRDocumentResponse(BaseModel):
    document_id: str
    total_pages: int
    total_word_count: int
    average_confidence: float
    language_detected: str
    pages: List[OCRPageResult]
    processing_time_ms: int
    engine: str
    has_tables: bool
    has_forms: bool
    has_handwriting: bool


# ─── MinIO Client ──────────────────────────────────────────────────────────

def get_document_bytes(storage_path: str, bucket: str) -> bytes:
    """Download document from MinIO."""
    from minio import Minio

    minio = Minio(
        endpoint=os.getenv("MINIO_ENDPOINT", "minio:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        secure=os.getenv("MINIO_USE_SSL", "false").lower() == "true",
    )

    response = minio.get_object(bucket, storage_path)
    return response.read()


# ─── Core OCR Processing ───────────────────────────────────────────────────

async def process_pdf_pages(
    pdf_bytes: bytes,
    language: str,
    extract_tables: bool,
    extract_forms: bool,
) -> List[OCRPageResult]:
    """
    Process each page of a PDF:
    1. Convert page to high-resolution image (300 DPI)
    2. Preprocess (deskew, denoise, enhance)
    3. Run OCR engine
    4. Extract tables
    5. Detect handwriting/signatures
    """
    import fitz  # PyMuPDF

    pages = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for page_num in range(len(doc)):
        page_start = time.perf_counter()
        page = doc[page_num]

        # Render at 300 DPI for high quality OCR
        mat = fitz.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")

        # Preprocess image
        processed_img, preprocessing_meta = _preprocessor.process(img_bytes)

        # Run OCR
        ocr_result = _ocr_engine.process(
            image=processed_img,
            language=language,
        )

        # Extract tables if requested
        tables = []
        if extract_tables and ocr_result["confidence"] > 0.5:
            tables = _table_extractor.extract(processed_img)

        # Calculate metrics
        page_time_ms = int((time.perf_counter() - page_start) * 1000)
        word_count = len(ocr_result["text"].split())

        pages.append(
            OCRPageResult(
                page_number=page_num + 1,
                raw_text=ocr_result["text"],
                word_count=word_count,
                confidence_score=ocr_result["confidence"],
                bounding_boxes=[
                    WordBoundingBox(
                        text=box["text"],
                        confidence=box["confidence"],
                        bbox=box["bbox"],
                    )
                    for box in ocr_result.get("boxes", [])
                ],
                tables=tables,
                has_handwriting=ocr_result.get("has_handwriting", False),
                has_signatures=ocr_result.get("has_signatures", False),
                is_rotated=preprocessing_meta.get("was_rotated", False),
                rotation_angle=preprocessing_meta.get("rotation_angle", 0.0),
                page_width=float(pix.width),
                page_height=float(pix.height),
                processing_time_ms=page_time_ms,
                engine_used=ocr_result.get("engine", "ensemble"),
            )
        )

    doc.close()
    return pages


# ─── Endpoints ────────────────────────────────────────────────────────────

@app.post("/ocr/process", response_model=OCRDocumentResponse)
async def process_document(request: ProcessDocumentRequest) -> OCRDocumentResponse:
    """
    Process a full document (PDF/image) from object storage.
    Handles scanned PDFs, native PDFs, and image files.
    """
    overall_start = time.perf_counter()

    logger.info("ocr.processing_start", document_id=request.document_id)

    # Download from MinIO
    try:
        doc_bytes = get_document_bytes(request.storage_path, request.storage_bucket)
    except Exception as exc:
        logger.error("ocr.download_failed", error=str(exc), document_id=request.document_id)
        raise HTTPException(status_code=500, detail=f"Failed to download document: {exc}")

    # Determine file type and process accordingly
    mime_type = _detect_mime(doc_bytes)

    if mime_type == "application/pdf":
        pages = await process_pdf_pages(
            doc_bytes,
            request.language,
            request.extract_tables,
            request.extract_forms,
        )
    elif mime_type.startswith("image/"):
        # Single image file
        processed_img, meta = _preprocessor.process(doc_bytes)
        ocr_result = _ocr_engine.process(processed_img, request.language)
        tables = _table_extractor.extract(processed_img) if request.extract_tables else []

        pages = [
            OCRPageResult(
                page_number=1,
                raw_text=ocr_result["text"],
                word_count=len(ocr_result["text"].split()),
                confidence_score=ocr_result["confidence"],
                bounding_boxes=[
                    WordBoundingBox(**b) for b in ocr_result.get("boxes", [])
                ],
                tables=tables,
                has_handwriting=ocr_result.get("has_handwriting", False),
                has_signatures=ocr_result.get("has_signatures", False),
                is_rotated=meta.get("was_rotated", False),
                rotation_angle=meta.get("rotation_angle", 0.0),
                page_width=0,
                page_height=0,
                processing_time_ms=0,
                engine_used=ocr_result.get("engine", "ensemble"),
            )
        ]
    else:
        raise HTTPException(status_code=415, detail=f"Unsupported file type for OCR: {mime_type}")

    total_words = sum(p.word_count for p in pages)
    avg_confidence = sum(p.confidence_score for p in pages) / max(len(pages), 1)
    total_time_ms = int((time.perf_counter() - overall_start) * 1000)

    response = OCRDocumentResponse(
        document_id=request.document_id,
        total_pages=len(pages),
        total_word_count=total_words,
        average_confidence=round(avg_confidence, 4),
        language_detected=request.language,
        pages=pages,
        processing_time_ms=total_time_ms,
        engine=os.getenv("OCR_ENGINE", "ensemble"),
        has_tables=any(len(p.tables) > 0 for p in pages),
        has_forms=False,
        has_handwriting=any(p.has_handwriting for p in pages),
    )

    logger.info(
        "ocr.processing_complete",
        document_id=request.document_id,
        pages=len(pages),
        avg_confidence=avg_confidence,
        time_ms=total_time_ms,
    )

    return response


@app.post("/ocr/image", response_model=OCRPageResult)
async def process_image(request: ProcessImageRequest) -> OCRPageResult:
    """Process a raw base64-encoded image."""
    start = time.perf_counter()

    img_bytes = base64.b64decode(request.image_base64)
    processed_img, meta = _preprocessor.process(img_bytes)
    ocr_result = _ocr_engine.process(processed_img, request.language)
    tables = _table_extractor.extract(processed_img) if request.extract_tables else []

    return OCRPageResult(
        page_number=1,
        raw_text=ocr_result["text"],
        word_count=len(ocr_result["text"].split()),
        confidence_score=ocr_result["confidence"],
        bounding_boxes=[WordBoundingBox(**b) for b in ocr_result.get("boxes", [])],
        tables=tables,
        has_handwriting=False,
        has_signatures=False,
        is_rotated=meta.get("was_rotated", False),
        rotation_angle=meta.get("rotation_angle", 0.0),
        page_width=0,
        page_height=0,
        processing_time_ms=int((time.perf_counter() - start) * 1000),
        engine_used=ocr_result.get("engine", "ensemble"),
    )


@app.get("/ocr/health")
async def health():
    return {"status": "healthy", "engine": os.getenv("OCR_ENGINE", "ensemble")}


def _detect_mime(content: bytes) -> str:
    import magic
    return magic.from_buffer(content, mime=True)
