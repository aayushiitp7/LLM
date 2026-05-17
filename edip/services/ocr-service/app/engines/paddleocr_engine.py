"""
PaddleOCR Engine — High-accuracy OCR with layout analysis

Uses PaddleOCR with:
- PP-OCR v4 model (state-of-the-art accuracy)
- Layout analysis (column detection, table detection)
- Text detection + recognition pipeline
- Confidence score per word/line
- Bounding box extraction
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
import structlog

logger = structlog.get_logger(__name__)


class PaddleOCREngine:
    """
    PaddleOCR-based OCR engine.
    Supports English and 80+ languages.
    Returns structured output with confidence scores and bounding boxes.
    """

    def __init__(
        self,
        lang: str = "en",
        use_gpu: bool = False,
        use_angle_cls: bool = True,
        det_model_dir: Optional[str] = None,
        rec_model_dir: Optional[str] = None,
        cls_model_dir: Optional[str] = None,
    ):
        self.lang = lang
        self.use_gpu = use_gpu
        self._engine = None
        self._initialized = False
        self._init_kwargs = {
            "lang": lang,
            "use_gpu": use_gpu,
            "use_angle_cls": use_angle_cls,
            "show_log": False,
        }
        if det_model_dir:
            self._init_kwargs["det_model_dir"] = det_model_dir
        if rec_model_dir:
            self._init_kwargs["rec_model_dir"] = rec_model_dir

        self._initialize()

    def _initialize(self) -> None:
        """Lazy initialization — PaddleOCR model loading is expensive."""
        try:
            from paddleocr import PaddleOCR
            self._engine = PaddleOCR(**self._init_kwargs)
            self._initialized = True
            logger.info("paddleocr.initialized", lang=self.lang, gpu=self.use_gpu)
        except ImportError:
            logger.warning("paddleocr.not_installed", msg="Falling back to Tesseract")
            self._initialized = False
        except Exception as exc:
            logger.error("paddleocr.init_failed", error=str(exc))
            self._initialized = False

    def process(
        self,
        image: np.ndarray,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run PaddleOCR on a preprocessed image.

        Args:
            image: OpenCV BGR image (numpy array)
            language: Override instance language

        Returns:
            {
                "text": str,                   # Full concatenated text
                "confidence": float,           # Average confidence
                "boxes": [...],                # Per-word bounding boxes
                "has_handwriting": bool,
                "has_signatures": bool,
                "engine": "paddleocr",
            }
        """
        if not self._initialized or self._engine is None:
            raise RuntimeError("PaddleOCR engine not initialized.")

        start = time.perf_counter()

        try:
            result = self._engine.ocr(image, cls=True)
        except Exception as exc:
            logger.error("paddleocr.inference_failed", error=str(exc))
            raise

        # Parse results
        all_text_lines = []
        all_boxes = []
        all_confidences = []

        if result and result[0]:
            for line in result[0]:
                if line is None:
                    continue

                bbox, (text, confidence) = line

                if not text or confidence < 0.1:
                    continue

                all_text_lines.append(text)
                all_confidences.append(confidence)
                all_boxes.append(
                    {
                        "text": text,
                        "confidence": round(float(confidence), 4),
                        "bbox": [[float(p[0]), float(p[1])] for p in bbox],
                    }
                )

        full_text = " ".join(all_text_lines)
        avg_confidence = (
            sum(all_confidences) / len(all_confidences) if all_confidences else 0.0
        )

        latency_ms = int((time.perf_counter() - start) * 1000)

        logger.debug(
            "paddleocr.inference_complete",
            words=len(all_boxes),
            confidence=round(avg_confidence, 3),
            latency_ms=latency_ms,
        )

        return {
            "text": full_text,
            "confidence": round(avg_confidence, 4),
            "boxes": all_boxes,
            "has_handwriting": self._detect_handwriting(image, avg_confidence),
            "has_signatures": self._detect_signatures(image),
            "engine": "paddleocr",
            "latency_ms": latency_ms,
        }

    def _detect_handwriting(self, image: np.ndarray, ocr_confidence: float) -> bool:
        """
        Heuristic handwriting detection.
        Low OCR confidence on a clean image often indicates handwriting.
        """
        # If confidence is very low (< 0.5) despite good image quality,
        # handwriting is likely
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Count connected components — handwriting has more irregular components
        num_labels, _, stats, _ = cv2.connectedComponentsWithStats(
            255 - thresh, connectivity=8
        )

        # High component count + low confidence = handwriting indicator
        return num_labels > 500 and ocr_confidence < 0.65

    def _detect_signatures(self, image: np.ndarray) -> bool:
        """
        Heuristic signature detection using contour analysis.
        Signatures tend to be isolated, curved, low-aspect-ratio regions.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        signature_candidates = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 1000:
                continue

            x, y, w, h = cv2.boundingRect(cnt)
            aspect_ratio = w / max(h, 1)

            # Signatures tend to be wide, irregular shapes
            if 2.0 < aspect_ratio < 8.0 and 500 < area < 50000:
                signature_candidates += 1

        return signature_candidates >= 1

    @property
    def name(self) -> str:
        return "paddleocr"
