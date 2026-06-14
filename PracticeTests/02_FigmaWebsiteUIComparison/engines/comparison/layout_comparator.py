"""Layout Comparator — compares position, dimensions, and spacing."""

from loggers.logger import get_logger

logger = get_logger(__name__)


class LayoutComparator:
    """Compares layout properties between matched Figma and Web elements."""

    @staticmethod
    def compare(figma: dict, web: dict, tolerance: dict = None) -> list[dict]:
        """Compare layout properties.

        Args:
            figma: Figma NormalizedElement dict.
            web: Web NormalizedElement dict.
            tolerance: Dict with position, size, border_radius tolerances.

        Returns:
            List of check dicts.
        """
        if tolerance is None:
            tolerance = {"position": 2, "size": 2, "border_radius": 1}

        if not figma or not web:
            return []

        f_box = figma.get("bounding_box", {}) or {}
        w_box = web.get("bounding_box", {}) or {}
        f_layout = figma.get("styles", {}).get("layout", {}) or {}
        w_layout = web.get("styles", {}).get("layout", {}) or {}
        checks = []

        pos_tol = tolerance.get("position", 2)
        size_tol = tolerance.get("size", 2)

        # Position
        checks.append(LayoutComparator._check_pos("x", f_box.get("x", 0), w_box.get("x", 0), pos_tol))
        checks.append(LayoutComparator._check_pos("y", f_box.get("y", 0), w_box.get("y", 0), pos_tol))

        # Dimensions
        checks.append(LayoutComparator._check_dim("width", f_box.get("width", 0), w_box.get("width", 0), size_tol))
        checks.append(LayoutComparator._check_dim("height", f_box.get("height", 0), w_box.get("height", 0), size_tol))

        # Margin
        f_margin = f_layout.get("margin", {}) or {}
        w_margin = w_layout.get("margin", {}) or {}
        for side in ["top", "right", "bottom", "left"]:
            checks.append(LayoutComparator._check_spacing(
                "margin", side, f_margin.get(side, 0), w_margin.get(side, 0), pos_tol
            ))

        # Padding
        f_padding = f_layout.get("padding", {}) or {}
        w_padding = w_layout.get("padding", {}) or {}
        for side in ["top", "right", "bottom", "left"]:
            checks.append(LayoutComparator._check_spacing(
                "padding", side, f_padding.get(side, 0), w_padding.get(side, 0), pos_tol
            ))

        # Border radius
        br_tol = tolerance.get("border_radius", 1)
        checks.append(LayoutComparator._check_num(
            "layout", "border_radius",
            f_layout.get("border_radius", 0), w_layout.get("border_radius", 0),
            br_tol, "px", "low"
        ))

        # Border width
        checks.append(LayoutComparator._check_num(
            "layout", "border_width",
            f_layout.get("border_width", 0), w_layout.get("border_width", 0),
            1, "px", "low"
        ))

        # Display
        checks.append(LayoutComparator._check_str(
            "layout", "display",
            f_layout.get("display", ""), w_layout.get("display", ""),
            "medium"
        ))

        # Opacity
        f_opacity = figma.get("styles", {}).get("colors", {}).get("opacity", 1.0)
        w_opacity = web.get("styles", {}).get("colors", {}).get("opacity", 1.0)
        checks.append(LayoutComparator._check_num(
            "layout", "opacity", f_opacity, w_opacity, 0.05, "", "low"
        ))

        # Overflow
        checks.append(LayoutComparator._check_str(
            "layout", "overflow",
            f_layout.get("overflow", ""), w_layout.get("overflow", ""),
            "low"
        ))

        return checks

    @staticmethod
    def _check_pos(prop: str, expected, actual, tol: int) -> dict:
        """Check position property."""
        exp = float(expected or 0)
        act = float(actual or 0)
        diff = act - exp
        passed = abs(diff) <= tol

        severity = "high" if not passed and abs(diff) > tol * 5 else ("medium" if not passed else "none")
        return {
            "category": "layout",
            "property": f"position_{prop}",
            "expected": exp,
            "actual": act,
            "unit": "px",
            "status": "PASS" if passed else "FAIL",
            "severity": severity,
            "difference": round(diff, 1),
        }

    @staticmethod
    def _check_dim(prop: str, expected, actual, tol: int) -> dict:
        """Check dimension property."""
        exp = float(expected or 0)
        act = float(actual or 0)
        diff = act - exp
        passed = abs(diff) <= tol

        severity = "high" if not passed and abs(diff) > tol * 5 else ("medium" if not passed else "none")
        return {
            "category": "layout",
            "property": prop,
            "expected": exp,
            "actual": act,
            "unit": "px",
            "status": "PASS" if passed else "FAIL",
            "severity": severity,
            "difference": round(diff, 1),
        }

    @staticmethod
    def _check_spacing(category: str, side: str, expected, actual, tol: int) -> dict:
        """Check margin/padding property."""
        exp = float(expected or 0)
        act = float(actual or 0)
        diff = act - exp
        passed = abs(diff) <= tol

        return {
            "category": "layout",
            "property": f"{category}_{side}",
            "expected": exp,
            "actual": act,
            "unit": "px",
            "status": "PASS" if passed else "FAIL",
            "severity": "medium" if not passed and abs(diff) > tol * 3 else ("low" if not passed else "none"),
            "difference": round(diff, 1),
        }

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
        return {
            "category": category,
            "property": prop,
            "expected": exp,
            "actual": act,
            "unit": unit,
            "status": "PASS" if passed else "FAIL",
            "severity": severity if not passed else "none",
            "difference": round(diff, 2),
        }
