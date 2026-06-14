"""Color Comparator — compares color properties using CIEDE2000 delta-E."""

import math
from loggers.logger import get_logger

logger = get_logger(__name__)


class ColorComparator:
    """Compares color properties between matched Figma and Web elements."""

    @staticmethod
    def compare(figma: dict, web: dict, tolerance: dict = None) -> list[dict]:
        """Compare color properties.

        Args:
            figma: Figma NormalizedElement dict.
            web: Web NormalizedElement dict.
            tolerance: Dict with color_delta_e, opacity tolerances.

        Returns:
            List of check dicts.
        """
        if tolerance is None:
            tolerance = {"color_delta_e": 2.0, "opacity": 0.05}

        if not figma or not web:
            return []

        f_colors = figma.get("styles", {}).get("colors", {}) or {}
        w_colors = web.get("styles", {}).get("colors", {}) or {}
        checks = []
        delta_e_max = tolerance.get("color_delta_e", 2.0)

        # Text color
        checks.append(ColorComparator._check_color(
            "colors", "color",
            f_colors.get("color"), w_colors.get("color"),
            delta_e_max, "medium"
        ))

        # Background color
        checks.append(ColorComparator._check_color(
            "colors", "background_color",
            f_colors.get("background_color"), w_colors.get("background_color"),
            delta_e_max, "medium"
        ))

        # Border color
        checks.append(ColorComparator._check_color(
            "colors", "border_color",
            f_colors.get("border_color"), w_colors.get("border_color"),
            delta_e_max * 1.5, "low"
        ))

        # Opacity
        checks.append(ColorComparator._check_opacity(
            f_colors.get("opacity", 1.0), w_colors.get("opacity", 1.0),
            tolerance.get("opacity", 0.05)
        ))

        return checks

    @staticmethod
    def _check_color(category: str, prop: str, expected, actual, delta_e_max: float, severity: str) -> dict:
        """Compare two colors using CIEDE2000."""
        if not expected or not actual:
            passed = expected is None and actual is None
            return {
                "category": category,
                "property": prop,
                "expected": expected,
                "actual": actual,
                "unit": "delta-e",
                "status": "PASS" if passed else "FAIL",
                "severity": severity if not passed else "none",
                "difference": None if passed else "MISMATCH",
            }

        de = ColorComparator._ciede2000(expected, actual)
        passed = de <= delta_e_max

        # Dynamic severity
        final_severity = severity
        if not passed:
            if de > delta_e_max * 3:
                final_severity = "high"
            elif de > delta_e_max * 2:
                final_severity = severity

        return {
            "category": category,
            "property": prop,
            "expected": f"rgba({expected.get('r')},{expected.get('g')},{expected.get('b')},{expected.get('a')})",
            "actual": f"rgba({actual.get('r')},{actual.get('g')},{actual.get('b')},{actual.get('a')})",
            "unit": "delta-e",
            "status": "PASS" if passed else "FAIL",
            "severity": final_severity if not passed else "none",
            "difference": round(de, 2),
        }

    @staticmethod
    def _check_opacity(expected: float, actual: float, tolerance: float) -> dict:
        """Compare opacity values."""
        exp = float(expected or 1.0)
        act = float(actual or 1.0)
        diff = act - exp
        passed = abs(diff) <= tolerance

        return {
            "category": "colors",
            "property": "opacity",
            "expected": exp,
            "actual": act,
            "unit": "",
            "status": "PASS" if passed else "FAIL",
            "severity": "low" if not passed else "none",
            "difference": round(diff, 3),
        }

    # ------------------------------------------------------------------ #
    # CIEDE2000 implementation
    # Reference: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000
    # ------------------------------------------------------------------ #

    @staticmethod
    def _ciede2000(c1: dict, c2: dict) -> float:
        """Calculate CIEDE2000 color difference between two RGBA dicts."""
        # Convert sRGB to Lab
        l1, a1, b1 = ColorComparator._rgb_to_lab(c1)
        l2, a2, b2 = ColorComparator._rgb_to_lab(c2)

        # Weighting factors
        kL = 1.0
        kC = 1.0
        kH = 1.0

        C1 = math.sqrt(a1 ** 2 + b1 ** 2)
        C2 = math.sqrt(a2 ** 2 + b2 ** 2)
        C_avg = (C1 + C2) / 2.0

        G = 0.5 * (1 - math.sqrt(C_avg ** 7 / (C_avg ** 7 + 25 ** 7)))

        a1p = a1 * (1 + G)
        a2p = a2 * (1 + G)

        C1p = math.sqrt(a1p ** 2 + b1 ** 2)
        C2p = math.sqrt(a2p ** 2 + b2 ** 2)

        h1p = math.degrees(math.atan2(b1, a1p)) % 360
        h2p = math.degrees(math.atan2(b2, a2p)) % 360

        dLp = l2 - l1
        dCp = C2p - C1p

        # Hue difference
        dhp = 0.0
        if C1p * C2p != 0:
            diff_h = h2p - h1p
            if abs(diff_h) <= 180:
                dhp = diff_h
            elif diff_h > 180:
                dhp = diff_h - 360
            elif diff_h < -180:
                dhp = diff_h + 360

        dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2.0))

        # Weighted averages
        L_avg = (l1 + l2) / 2.0
        C_avg_p = (C1p + C2p) / 2.0

        H_avg_p = h1p + h2p
        if C1p * C2p != 0:
            if abs(h1p - h2p) > 180:
                H_avg_p = (h1p + h2p + 360) / 2.0
            else:
                H_avg_p = (h1p + h2p) / 2.0

        # T
        T = (1
             - 0.17 * math.cos(math.radians(H_avg_p - 30))
             + 0.24 * math.cos(math.radians(2 * H_avg_p))
             + 0.32 * math.cos(math.radians(3 * H_avg_p + 6))
             - 0.20 * math.cos(math.radians(4 * H_avg_p - 63))
             )

        # Delta theta
        dTheta = 30 * math.exp(-((H_avg_p - 275) / 25) ** 2)

        # Rc
        Rc = 2 * math.sqrt(C_avg_p ** 7 / (C_avg_p ** 7 + 25 ** 7))

        # SL, SC, SH
        SL = 1 + (0.015 * (L_avg - 50) ** 2) / math.sqrt(20 + (L_avg - 50) ** 2)
        SC = 1 + 0.045 * C_avg_p
        SH = 1 + 0.015 * C_avg_p * T

        # RT
        RT = -math.sin(math.radians(2 * dTheta)) * Rc

        # Final delta-E
        dE = math.sqrt(
            (dLp / (kL * SL)) ** 2
            + (dCp / (kC * SC)) ** 2
            + (dHp / (kH * SH)) ** 2
            + RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
        )

        return dE

    @staticmethod
    def _rgb_to_lab(color: dict) -> tuple:
        """Convert sRGB (0-255) to CIE Lab color space."""
        r = (color.get("r", 0) or 0) / 255.0
        g = (color.get("g", 0) or 0) / 255.0
        b = (color.get("b", 0) or 0) / 255.0

        # Linearize
        r = ColorComparator._linearize(r)
        g = ColorComparator._linearize(g)
        b = ColorComparator._linearize(b)

        # sRGB to XYZ (D65 illuminant)
        x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
        y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
        z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041

        # Normalize for D65
        x /= 0.95047
        y /= 1.00000
        z /= 1.08883

        # XYZ to Lab
        fx = ColorComparator._lab_f(x)
        fy = ColorComparator._lab_f(y)
        fz = ColorComparator._lab_f(z)

        L = 116 * fy - 16
        a = 500 * (fx - fy)
        b_ = 200 * (fy - fz)

        return L, a, b_

    @staticmethod
    def _linearize(c: float) -> float:
        """Apply sRGB gamma correction (linearize)."""
        if c <= 0.04045:
            return c / 12.92
        return ((c + 0.055) / 1.055) ** 2.4

    @staticmethod
    def _lab_f(t: float) -> float:
        """CIE Lab helper function."""
        if t > 0.008856:
            return t ** (1 / 3.0)
        return (903.3 * t + 16) / 116.0
