"""Accessibility Comparator — WCAG 2.1 AA compliance checks."""

import math
from loggers.logger import get_logger

logger = get_logger(__name__)


class AccessibilityComparator:
    """Performs WCAG 2.1 AA accessibility checks on matched elements."""

    @staticmethod
    def compare(figma: dict, web: dict, tolerance: dict = None) -> list[dict]:
        """Compare accessibility properties.

        Args:
            figma: Figma NormalizedElement dict.
            web: Web NormalizedElement dict.
            tolerance: Not used, kept for consistent API.

        Returns:
            List of check dicts.
        """
        if not figma or not web:
            return []

        checks = []
        f_a11y = figma.get("accessibility", {}) or {}
        w_a11y = web.get("accessibility", {}) or {}
        f_tag = figma.get("tag", "")
        w_tag = web.get("tag", "")
        f_type = figma.get("type", "")

        # Alt text on images
        if f_tag in ("img",) or f_type == "image":
            alt_text = w_a11y.get("alt_text") or ""
            passed = bool(alt_text)
            checks.append({
                "category": "accessibility",
                "property": "alt_text_presence",
                "expected": "alt text present",
                "actual": f"alt='{alt_text}'" if alt_text else "(missing)",
                "unit": "",
                "status": "PASS" if passed else "FAIL",
                "severity": "critical" if not passed else "none",
                "difference": 0 if passed else 1,
            })

        # ARIA label on interactive elements
        if f_tag in ("button", "input", "select", "textarea", "a"):
            aria_label = w_a11y.get("aria_label") or ""
            if not aria_label:
                # Check if there's visible text content as fallback
                w_content = (web.get("content", "") or "").strip()
                if not w_content and w_tag != "img":
                    checks.append({
                        "category": "accessibility",
                        "property": "aria_label_presence",
                        "expected": "aria-label or visible text",
                        "actual": "(missing)",
                        "unit": "",
                        "status": "FAIL",
                        "severity": "high",
                        "difference": 1,
                    })

        # Heading hierarchy
        if f_tag.startswith("h") and len(f_tag) == 2 and f_tag[1].isdigit():
            f_level = int(f_tag[1])
            w_level = 0
            if w_tag.startswith("h") and len(w_tag) == 2 and w_tag[1].isdigit():
                w_level = int(w_tag[1])
            if w_level > 0 and f_level != w_level:
                checks.append({
                    "category": "accessibility",
                    "property": "heading_level",
                    "expected": f_level,
                    "actual": w_level,
                    "unit": "",
                    "status": "FAIL",
                    "severity": "medium",
                    "difference": w_level - f_level,
                })

        # Role assignment
        f_role = f_a11y.get("role", "")
        w_role = w_a11y.get("role", "")
        if f_role and not w_role:
            checks.append({
                "category": "accessibility",
                "property": "role_presence",
                "expected": f_role,
                "actual": "(missing)",
                "unit": "",
                "status": "FAIL",
                "severity": "medium",
                "difference": 1,
            })

        # Contrast ratio check (WCAG AA)
        f_colors = figma.get("styles", {}).get("colors", {}) or {}
        w_colors = web.get("styles", {}).get("colors", {}) or {}

        # Try web background + foreground color contrast
        bg_color = w_colors.get("background_color")
        fg_color = w_colors.get("color")

        if bg_color and bg_color.get("a", 1) >= 0.5:
            contrast_ratio = AccessibilityComparator._contrast_ratio(fg_color or {"r": 0, "g": 0, "b": 0, "a": 1}, bg_color)
            # Determine if text is "large" (>= 18px bold or >= 24px)
            w_typo = web.get("styles", {}).get("typography", {}) or {}
            font_size = float(w_typo.get("font_size", 16) or 16)
            font_weight = float(w_typo.get("font_weight", 400) or 400)
            is_large = font_size >= 24 or (font_size >= 18 and font_weight >= 700)

            aa_ratio = 3.0 if is_large else 4.5
            passed = contrast_ratio >= aa_ratio

            if not passed:
                checks.append({
                    "category": "accessibility",
                    "property": "contrast_ratio",
                    "expected": f">= {aa_ratio}:1",
                    "actual": f"{contrast_ratio:.1f}:1",
                    "unit": "ratio",
                    "status": "FAIL",
                    "severity": "high" if contrast_ratio < 3.0 else "medium",
                    "difference": round(aa_ratio - contrast_ratio, 2),
                })

        # Tabindex / keyboard accessibility
        if f_tag in ("button", "input", "select", "textarea", "a"):
            tabidx = w_a11y.get("tab_index", 0) or 0
            if tabidx < 0:
                checks.append({
                    "category": "accessibility",
                    "property": "tab_index",
                    "expected": ">= 0",
                    "actual": str(tabidx),
                    "unit": "",
                    "status": "FAIL",
                    "severity": "high",
                    "difference": tabidx,
                })

        return checks

    @staticmethod
    def _relative_luminance(color: dict) -> float:
        """Calculate WCAG relative luminance from sRGB color."""
        r = (color.get("r", 0) or 0) / 255.0
        g = (color.get("g", 0) or 0) / 255.0
        b = (color.get("b", 0) or 0) / 255.0

        # Linearize
        r = AccessibilityComparator._linearize(r)
        g = AccessibilityComparator._linearize(g)
        b = AccessibilityComparator._linearize(b)

        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    @staticmethod
    def _linearize(c: float) -> float:
        """Apply sRGB gamma correction."""
        if c <= 0.04045:
            return c / 12.92
        return ((c + 0.055) / 1.055) ** 2.4

    @staticmethod
    def _contrast_ratio(fg: dict, bg: dict) -> float:
        """Calculate WCAG contrast ratio between two colors."""
        l1 = AccessibilityComparator._relative_luminance(fg)
        l2 = AccessibilityComparator._relative_luminance(bg)
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)
