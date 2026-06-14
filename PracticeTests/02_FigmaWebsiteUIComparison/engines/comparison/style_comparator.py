"""Style Comparator — compares typography properties."""

from loggers.logger import get_logger

logger = get_logger(__name__)


class StyleComparator:
    """Compares typography properties between matched Figma and Web elements."""

    @staticmethod
    def compare(figma: dict, web: dict, tolerance: dict = None) -> list[dict]:
        """Compare typography properties.

        Args:
            figma: Figma NormalizedElement dict.
            web: Web NormalizedElement dict.
            tolerance: Dict with font_size, font_weight, letter_spacing, line_height tolerances.

        Returns:
            List of check dicts.
        """
        if tolerance is None:
            tolerance = {"font_size": 1, "font_weight": 100, "letter_spacing": 0.5, "line_height": 2}

        if not figma or not web:
            return []

        f_typo = figma.get("styles", {}).get("typography", {}) or {}
        w_typo = web.get("styles", {}).get("typography", {}) or {}
        checks = []

        # Font family
        checks.append(StyleComparator._check_str(
            "typography", "font_family",
            f_typo.get("font_family", ""), w_typo.get("font_family", ""),
            severity="high"
        ))

        # Font size
        checks.append(StyleComparator._check_num(
            "typography", "font_size",
            f_typo.get("font_size", 0), w_typo.get("font_size", 0),
            tolerance.get("font_size", 1), "px", "medium"
        ))

        # Font weight
        checks.append(StyleComparator._check_num(
            "typography", "font_weight",
            f_typo.get("font_weight", 0), w_typo.get("font_weight", 0),
            tolerance.get("font_weight", 100), "", "medium"
        ))

        # Letter spacing
        checks.append(StyleComparator._check_num(
            "typography", "letter_spacing",
            f_typo.get("letter_spacing", 0), w_typo.get("letter_spacing", 0),
            tolerance.get("letter_spacing", 0.5), "px", "low"
        ))

        # Line height
        checks.append(StyleComparator._check_num(
            "typography", "line_height",
            f_typo.get("line_height", 0), w_typo.get("line_height", 0),
            tolerance.get("line_height", 2), "px", "medium"
        ))

        # Text align
        checks.append(StyleComparator._check_str(
            "typography", "text_align",
            f_typo.get("text_align", ""), w_typo.get("text_align", ""),
            severity="medium"
        ))

        # Text decoration
        checks.append(StyleComparator._check_str(
            "typography", "text_decoration",
            f_typo.get("text_decoration", ""), w_typo.get("text_decoration", ""),
            severity="medium"
        ))

        # Text transform
        checks.append(StyleComparator._check_str(
            "typography", "text_transform",
            f_typo.get("text_transform", ""), w_typo.get("text_transform", ""),
            severity="low"
        ))

        return checks

    @staticmethod
    def _check_str(category: str, prop: str, expected, actual, severity: str) -> dict:
        """Compare two string values."""
        exp = str(expected or "")
        act = str(actual or "")
        passed = exp.lower() == act.lower()
        return {
            "category": category,
            "property": prop,
            "expected": exp,
            "actual": act,
            "unit": "",
            "status": "PASS" if passed else "FAIL",
            "severity": severity if not passed else "none",
            "difference": 0 if passed else 1,
        }

    @staticmethod
    def _check_num(category: str, prop: str, expected, actual, tol, unit: str, severity: str) -> dict:
        """Compare two numeric values within tolerance."""
        exp = float(expected or 0)
        act = float(actual or 0)
        diff = act - exp
        passed = abs(diff) <= tol

        # Dynamic severity based on diff magnitude
        final_severity = severity
        if not passed:
            abs_diff = abs(diff)
            if abs_diff > tol * 3:
                final_severity = "high" if severity != "low" else "medium"
            elif abs_diff > tol * 2:
                final_severity = severity

        return {
            "category": category,
            "property": prop,
            "expected": exp,
            "actual": act,
            "unit": unit,
            "status": "PASS" if passed else "FAIL",
            "severity": final_severity if not passed else "none",
            "difference": round(diff, 2),
        }
