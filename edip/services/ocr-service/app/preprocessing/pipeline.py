"""
Image Preprocessing Pipeline

Applies a sequence of image enhancement techniques before OCR:
1. Deskewing (correct rotated scans)
2. Denoising (remove scan artifacts)
3. Contrast enhancement (CLAHE)
4. Binarization (Otsu's method)
5. Border removal
6. Shadow removal
7. Multi-column detection

Each step is tracked with metadata for quality analysis.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np
import structlog
from PIL import Image, ImageEnhance, ImageFilter

logger = structlog.get_logger(__name__)


class ImagePreprocessingPipeline:
    """
    Production image preprocessing for scanned documents.
    Designed for low-quality, multi-column, skewed, noisy scans.
    """

    def __init__(
        self,
        target_dpi: int = 300,
        deskew: bool = True,
        denoise: bool = True,
        enhance_contrast: bool = True,
        remove_shadows: bool = True,
        remove_borders: bool = True,
    ):
        self.target_dpi = target_dpi
        self.do_deskew = deskew
        self.do_denoise = denoise
        self.do_enhance_contrast = enhance_contrast
        self.do_remove_shadows = remove_shadows
        self.do_remove_borders = remove_borders

    def process(
        self, image_bytes: bytes
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Run the full preprocessing pipeline on raw image bytes.

        Returns:
            (processed_image: np.ndarray BGR, metadata: dict)
        """
        metadata: Dict[str, Any] = {
            "was_rotated": False,
            "rotation_angle": 0.0,
            "was_denoised": False,
            "contrast_enhanced": False,
            "borders_removed": False,
            "original_size": None,
            "processed_size": None,
            "processing_time_ms": 0,
        }

        start = time.perf_counter()

        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Failed to decode image bytes. Possibly corrupted.")

        metadata["original_size"] = (img.shape[1], img.shape[0])  # (width, height)

        # Step 1: Shadow removal (illumination normalization)
        if self.do_remove_shadows:
            img = self._remove_shadows(img)
            metadata["shadow_removed"] = True

        # Step 2: Convert to grayscale for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Step 3: Deskewing
        if self.do_deskew:
            angle = self._detect_skew(gray)
            if abs(angle) > 0.3:  # Only correct if skew > 0.3 degrees
                img = self._rotate_image(img, angle)
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                metadata["was_rotated"] = True
                metadata["rotation_angle"] = round(angle, 2)

        # Step 4: Denoising
        if self.do_denoise:
            # Use Fast Non-Local Means Denoising (preserves text edges)
            gray = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
            img = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            metadata["was_denoised"] = True

        # Step 5: Contrast enhancement with CLAHE
        if self.do_enhance_contrast:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            enhanced = clahe.apply(gray)
            img = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
            metadata["contrast_enhanced"] = True

        # Step 6: Border removal
        if self.do_remove_borders:
            img = self._remove_borders(img)
            metadata["borders_removed"] = True

        metadata["processed_size"] = (img.shape[1], img.shape[0])
        metadata["processing_time_ms"] = int((time.perf_counter() - start) * 1000)

        return img, metadata

    def _detect_skew(self, gray: np.ndarray) -> float:
        """
        Detect page skew angle using Hough transform on text lines.
        Returns angle in degrees (positive = clockwise).
        """
        # Threshold
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Dilate to connect text components
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 1))
        dilated = cv2.dilate(thresh, kernel)

        # Find contours of text lines
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return 0.0

        # Get minimum area rectangles
        angles = []
        for cnt in contours:
            if cv2.contourArea(cnt) < 100:
                continue
            rect = cv2.minAreaRect(cnt)
            angle = rect[2]

            # Normalize angle to [-45, 45] range
            if angle < -45:
                angle = 90 + angle

            angles.append(angle)

        if not angles:
            return 0.0

        # Use median to handle outliers
        return float(np.median(angles))

    def _rotate_image(self, img: np.ndarray, angle: float) -> np.ndarray:
        """Rotate image by angle degrees around center, preserving size."""
        h, w = img.shape[:2]
        center = (w // 2, h // 2)

        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)

        # Calculate new bounding dimensions
        cos_a = abs(rotation_matrix[0, 0])
        sin_a = abs(rotation_matrix[0, 1])
        new_w = int(h * sin_a + w * cos_a)
        new_h = int(h * cos_a + w * sin_a)

        rotation_matrix[0, 2] += (new_w - w) / 2
        rotation_matrix[1, 2] += (new_h - h) / 2

        return cv2.warpAffine(
            img, rotation_matrix, (new_w, new_h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE,
        )

    def _remove_shadows(self, img: np.ndarray) -> np.ndarray:
        """
        Remove uneven illumination and shadows using background subtraction.
        Based on morphological operations.
        """
        rgb_planes = cv2.split(img)
        result_planes = []

        for plane in rgb_planes:
            dilated = cv2.dilate(plane, np.ones((7, 7), np.uint8))
            bg_img = cv2.medianBlur(dilated, 21)
            diff_img = 255 - cv2.absdiff(plane, bg_img)
            # Normalize
            norm = cv2.normalize(diff_img, None, 0, 255, cv2.NORM_MINMAX)
            result_planes.append(norm)

        return cv2.merge(result_planes)

    def _remove_borders(self, img: np.ndarray) -> np.ndarray:
        """
        Remove black/dark borders common in scanned documents.
        Uses contour detection to find the content area.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)

        # Find largest white rectangle (content area)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return img

        largest = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest)

        # Add small padding
        padding = 5
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(img.shape[1] - x, w + 2 * padding)
        h = min(img.shape[0] - y, h + 2 * padding)

        return img[y:y + h, x:x + w]

    def detect_columns(self, gray: np.ndarray) -> int:
        """
        Detect number of text columns in the document.
        Returns estimated column count (1-4).
        """
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Horizontal projection profile
        h_proj = np.sum(thresh, axis=0)

        # Smooth the profile
        kernel = np.ones(20) / 20
        smoothed = np.convolve(h_proj, kernel, mode="same")

        # Find valleys (column separators)
        threshold = smoothed.max() * 0.1
        is_valley = smoothed < threshold

        # Count transitions from content to valley
        transitions = np.diff(is_valley.astype(int))
        column_starts = np.where(transitions == 1)[0]

        return min(len(column_starts) + 1, 4)  # Cap at 4 columns
