"""Component Comparator — checks element presence, tag match, attributes, hierarchy."""

from loggers.logger import get_logger

logger = get_logger(__name__)


class ComponentComparator:
    """Compares component-level properties between matched Figma and Web elements."""

    @staticmethod
    def compare(figma: dict, web: dict, tolerance: dict = None) -> list[dict]:
        """Compare component properties.

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

        # Tag match
        f_tag = figma.get("tag", "")
        w_tag = web.get("tag", "")
        tag_match = f_tag == w_tag
        checks.append({
            "category": "components",
            "property": "tag",
            "expected": f_tag,
            "actual": w_tag,
            "unit": "",
            "status": "PASS" if tag_match else "FAIL",
            "severity": "critical" if not tag_match else "none",
            "difference": 0 if tag_match else 1,
        })

        # Type match
        f_type = figma.get("type", "")
        w_type = web.get("type", "")
        type_match = f_type == w_type
        if not type_match:
            checks.append({
                "category": "components",
                "property": "element_type",
                "expected": f_type,
                "actual": w_type,
                "unit": "",
                "status": "FAIL",
                "severity": "high",
                "difference": 1,
            })

        # Content check (text elements)
        f_content = (figma.get("content", "") or "").strip()
        w_content = (web.get("content", "") or "").strip()
        if f_content and figma.get("type") == "text":
            content_match = f_content.lower() in w_content.lower() or w_content.lower() in f_content.lower()
            if not content_match:
                checks.append({
                    "category": "components",
                    "property": "content",
                    "expected": f_content[:100],
                    "actual": w_content[:100],
                    "unit": "",
                    "status": "FAIL",
                    "severity": "high",
                    "difference": 1,
                })

        # Attribute checks based on tag
        f_a11y = figma.get("accessibility", {}) or {}
        w_a11y = web.get("accessibility", {}) or {}

        # Alt text (images)
        if f_tag in ("img",) or figma.get("type") == "image":
            f_alt = f_a11y.get("alt_text") or ""
            w_alt = w_a11y.get("alt_text") or ""
            if f_alt and not w_alt:
                checks.append({
                    "category": "components",
                    "property": "alt_text",
                    "expected": f_alt,
                    "actual": "(missing)",
                    "unit": "",
                    "status": "FAIL",
                    "severity": "critical",
                    "difference": 1,
                })

        # ARIA label
        f_aria = f_a11y.get("aria_label") or ""
        w_aria = w_a11y.get("aria_label") or ""
        if f_aria and not w_aria:
            checks.append({
                "category": "components",
                "property": "aria_label",
                "expected": f_aria,
                "actual": "(missing)",
                "unit": "",
                "status": "FAIL",
                "severity": "high",
                "difference": 1,
            })

        # Role match for interactive elements
        f_role = f_a11y.get("role") or ""
        w_role = w_a11y.get("role") or ""
        if f_role and w_role and f_role != w_role:
            checks.append({
                "category": "components",
                "property": "role",
                "expected": f_role,
                "actual": w_role,
                "unit": "",
                "status": "FAIL",
                "severity": "medium",
                "difference": 1,
            })

        # Hierarchy depth check
        f_depth = figma.get("hierarchy", {}).get("depth", 0) or 0
        w_depth = web.get("hierarchy", {}).get("depth", 0) or 0
        depth_diff = abs(f_depth - w_depth)
        if depth_diff > 1:
            checks.append({
                "category": "components",
                "property": "hierarchy_depth",
                "expected": f_depth,
                "actual": w_depth,
                "unit": "",
                "status": "FAIL",
                "severity": "low",
                "difference": depth_diff,
            })

        return checks
