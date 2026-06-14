"""Image Comparator — screenshot pixel-diff and image property comparison."""

import os
import sys
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loggers.logger import get_logger

logger = get_logger(__name__)


class ImageComparator:
    """Compares images — screenshot pixel-diff and image element properties."""

    @staticmethod
    def compare(
        figma: dict,
        web: dict,
        figma_screenshot_path: Optional[str] = None,
        web_screenshot_path: Optional[str] = None,
        output_dir: Optional[str] = None,
        tolerance: dict = None,
    ) -> list[dict]:
        """Compare image properties and optionally perform screenshot diff.

        Args:
            figma: Figma NormalizedElement dict.
            web: Web NormalizedElement dict.
            figma_screenshot_path: Path to Figma exported screenshot.
            web_screenshot_path: Path to web captured screenshot.
            output_dir: Directory to save diff images.
            tolerance: Dict with size tolerance.

        Returns:
            List of check dicts.
        """
        if tolerance is None:
            tolerance = {"size": 2}

        checks = []

        # Image element property comparison
        f_box = figma.get("bounding_box", {}) or {}
        w_box = web.get("bounding_box", {}) or {}

        f_tag = figma.get("tag", "")
        w_tag = web.get("tag", "")

        # Check if this is an image element
        if f_tag in ("img",) or figma.get("type") in ("image", "rectangle"):
            # Width
            f_w = float(f_box.get("width", 0) or 0)
            w_w = float(w_box.get("width", 0) or 0)
            dim_tol = tolerance.get("size", 2)
            if f_w > 0 and w_w > 0:
                checks.append({
                    "category": "images",
                    "property": "width",
                    "expected": f_w,
                    "actual": w_w,
                    "unit": "px",
                    "status": "PASS" if abs(w_w - f_w) <= dim_tol else "FAIL",
                    "severity": "high" if abs(w_w - f_w) > dim_tol * 3 else ("medium" if abs(w_w - f_w) > dim_tol else "none"),
                    "difference": round(w_w - f_w, 1),
                })

            # Height
            f_h = float(f_box.get("height", 0) or 0)
            w_h = float(w_box.get("height", 0) or 0)
            if f_h > 0 and w_h > 0:
                checks.append({
                    "category": "images",
                    "property": "height",
                    "expected": f_h,
                    "actual": w_h,
                    "unit": "px",
                    "status": "PASS" if abs(w_h - f_h) <= dim_tol else "FAIL",
                    "severity": "high" if abs(w_h - f_h) > dim_tol * 3 else ("medium" if abs(w_h - f_h) > dim_tol else "none"),
                    "difference": round(w_h - f_h, 1),
                })

            # Aspect ratio
            if f_w > 0 and f_h > 0 and w_w > 0 and w_h > 0:
                f_ratio = f_w / f_h
                w_ratio = w_w / w_h
                ratio_diff = abs(w_ratio - f_ratio) / max(f_ratio, 0.01)
                checks.append({
                    "category": "images",
                    "property": "aspect_ratio",
                    "expected": round(f_ratio, 3),
                    "actual": round(w_ratio, 3),
                    "unit": "",
                    "status": "PASS" if ratio_diff < 0.05 else "FAIL",
                    "severity": "low" if ratio_diff < 0.05 else "medium",
                    "difference": round(ratio_diff * 100, 1),
                })

        # Screenshot pixel-diff (if both screenshot paths provided)
        if figma_screenshot_path and web_screenshot_path and os.path.exists(figma_screenshot_path) and os.path.exists(web_screenshot_path):
            try:
                diff_result = ImageComparator._diff_screenshots(
                    figma_screenshot_path, web_screenshot_path, output_dir
                )
                checks.append(diff_result)
            except Exception as e:
                logger.warning("Screenshot diff failed: %s", e)

        return checks

    @staticmethod
    def _diff_screenshots(figma_path: str, web_path: str, output_dir: Optional[str] = None) -> dict:
        """Pixel-diff two screenshots using Pillow."""
        from PIL import Image, ImageChops, ImageStat

        figma_img = Image.open(figma_path).convert("RGB")
        web_img = Image.open(web_path).convert("RGB")

        # Resize to same dimensions
        target_size = (max(figma_img.width, web_img.width), max(figma_img.height, web_img.height))
        figma_img = figma_img.resize(target_size, Image.LANCZOS)
        web_img = web_img.resize(target_size, Image.LANCZOS)

        # Compute difference
        diff = ImageChops.difference(figma_img, web_img)

        # Calculate diff percentage
        stat = ImageStat.Stat(diff)
        diff_sum = sum(stat.mean)
        diff_pct = diff_sum / (255 * 3) * 100

        # Create highlight image
        highlight = diff.point(lambda p: 255 if p > 20 else 0)
        highlight = highlight.convert("RGB")

        # Create overlay: red highlight on gray background
        gray_bg = Image.new("RGB", target_size, (128, 128, 128))
        overlay = Image.blend(gray_bg, Image.new("RGB", target_size, (255, 0, 0)), 0.5)
        overlay = Image.composite(overlay, gray_bg, highlight.convert("L"))

        # Save diff image
        diff_path = None
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            diff_path = os.path.join(output_dir, "diff_overlay.png")
            overlay.save(diff_path)

        # Severity based on diff percentage
        if diff_pct > 5:
            severity = "critical"
        elif diff_pct > 2:
            severity = "high"
        elif diff_pct > 0.5:
            severity = "medium"
        elif diff_pct > 0.1:
            severity = "low"
        else:
            severity = "none"

        return {
            "category": "images",
            "property": "screenshot_diff",
            "expected": "identical",
            "actual": f"{diff_pct:.1f}% different",
            "unit": "%",
            "status": "PASS" if diff_pct <= 0.5 else "FAIL",
            "severity": severity,
            "difference": round(diff_pct, 1),
            "diff_image_path": diff_path,
        }
