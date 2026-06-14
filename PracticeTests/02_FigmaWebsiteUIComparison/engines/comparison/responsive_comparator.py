"""Responsive Comparator — compares element behavior across multiple viewports."""

from loggers.logger import get_logger

logger = get_logger(__name__)


class ResponsiveComparator:
    """Compares element behavior across multiple viewport sizes."""

    @staticmethod
    def compare(
        figma: dict,
        web: dict,
        tolerance: dict = None,
        viewports: list[dict] = None,
        all_web_results: dict = None,
    ) -> list[dict]:
        """Compare responsive behavior.

        Args:
            figma: Figma NormalizedElement dict.
            web: Web NormalizedElement dict (primary/desktop viewport).
            tolerance: Dict with position, size tolerances.
            viewports: List of viewport configs.
            all_web_results: Dict of viewport_name -> {elements: [...], ...}
                             for cross-viewport comparison.

        Returns:
            List of check dicts.
        """
        if tolerance is None:
            tolerance = {"position": 2, "size": 2}

        checks = []

        # If we have data from multiple viewports, compare element behavior
        if not all_web_results or len(all_web_results) < 2:
            return checks

        # Get element info from primary viewport
        w_box = web.get("bounding_box", {}) or {}
        f_box = figma.get("bounding_box", {}) or {}
        w_tag = web.get("tag", "")

        # Check if element exists in other viewports
        viewport_names = sorted(all_web_results.keys())
        for vp_name in viewport_names:
            vp_data = all_web_results[vp_name]
            if not vp_data or vp_data.get("status") != "OK":
                continue

            # Try to find same element by tag + approximate position
            found = False
            for other in (vp_data.get("elements", []) or []):
                if other.get("tag") == w_tag:
                    other_box = other.get("bounding_box", {}) or {}
                    dx = abs((other_box.get("x", 0) or 0) - (w_box.get("x", 0) or 0))
                    dy = abs((other_box.get("y", 0) or 0) - (w_box.get("y", 0) or 0))
                    if dx < 100 and dy < 500:  # Same element (approximate)
                        found = True
                        break

            if not found and vp_name.lower() in ("tablet", "mobile"):
                # Check if element exists in figma at this viewport
                checks.append({
                    "category": "responsive",
                    "property": f"visibility_at_{vp_name.lower()}",
                    "expected": "visible",
                    "actual": "not found",
                    "unit": "",
                    "status": "FAIL",
                    "severity": "medium",
                    "difference": 1,
                })

        # Position shift between viewports
        if len(viewport_names) >= 2:
            primary = viewport_names[0]
            secondary = viewport_names[1]
            vp_primary = all_web_results.get(primary, {})
            vp_secondary = all_web_results.get(secondary, {})

            if vp_primary and vp_secondary:
                primary_elements = vp_primary.get("elements", []) or []
                secondary_elements = vp_secondary.get("elements", []) or []

                # Find matching elements and check if they reflow within expected bounds
                for p_el in primary_elements:
                    p_tag = p_el.get("tag", "")
                    if p_tag in ("script", "style", "meta"):
                        continue

                    p_box = p_el.get("bounding_box", {}) or {}
                    # Find same tag in secondary
                    for s_el in secondary_elements:
                        if s_el.get("tag") != p_tag:
                            continue
                        s_box = s_el.get("bounding_box", {}) or {}
                        # If same element moved more than expected, flag it
                        dx = abs((s_box.get("x", 0) or 0) - (p_box.get("x", 0) or 0))
                        if dx > 200:  # Significant reflow
                            checks.append({
                                "category": "responsive",
                                "property": f"position_shift_{p_tag}",
                                "expected": f"< 200px shift ({primary} -> {secondary})",
                                "actual": f"{dx:.0f}px shift",
                                "unit": "px",
                                "status": "PASS" if dx < 400 else "FAIL",
                                "severity": "low" if dx < 400 else "medium",
                                "difference": round(dx, 0),
                            })
                        break

        return checks
