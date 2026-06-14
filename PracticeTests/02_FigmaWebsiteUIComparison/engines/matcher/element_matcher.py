"""Element Matching Engine — 3-phase confidence-based matching of Figma to Web elements."""

import math
import os
import sys
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loggers.logger import get_logger

logger = get_logger(__name__)


# Matching weights
W_POSITION = 0.40
W_SIZE = 0.30
W_TYPE = 0.20
W_CONTENT = 0.10

# Thresholds
AUTO_MATCH = 0.80
AI_REVIEW = 0.60


class ElementMatcher:
    """Matches Figma elements to Web elements using 3-phase confidence scoring."""

    @staticmethod
    def match(
        figma_elements: list[dict],
        web_elements: list[dict],
        position_tolerance: int = 2,
        size_tolerance: int = 2,
    ) -> dict:
        """Match Figma elements to web elements.

        Args:
            figma_elements: List of NormalizedElement dicts from Figma.
            web_elements: List of NormalizedElement dicts from the web.
            position_tolerance: Position match tolerance in px.
            size_tolerance: Size match tolerance in px.

        Returns:
            Dict with matches, unmatched_figma, unmatched_web.
        """
        available_figma = list(figma_elements)
        available_web = list(web_elements)

        matches = []

        # Phase 1: Exact match
        remaining_figma, remaining_web = ElementMatcher._phase1_exact(
            available_figma, available_web, position_tolerance, size_tolerance, matches
        )

        # Phase 2: Heuristic match
        remaining_figma, remaining_web = ElementMatcher._phase2_heuristic(
            remaining_figma, remaining_web, matches
        )

        # Phase 3: Unmatched
        unmatched_figma = [e.get("id", "") for e in remaining_figma]
        unmatched_web = [e.get("id", "") for e in remaining_web]

        logger.info(
            "Matching complete: %d matched, %d unmatched figma, %d unmatched web",
            len(matches),
            len(unmatched_figma),
            len(unmatched_web),
        )

        return {
            "matches": matches,
            "unmatched_figma": unmatched_figma,
            "unmatched_web": unmatched_web,
        }

    @staticmethod
    def _phase1_exact(
        figma_elements: list[dict],
        web_elements: list[dict],
        pos_tol: int,
        size_tol: int,
        matches: list,
    ) -> tuple[list, list]:
        """Phase 1: Exact match — same tag, same text, same position within tolerance."""
        remaining_figma = []
        remaining_web = list(web_elements)

        for f_elem in figma_elements:
            matched = False
            f_box = f_elem.get("bounding_box", {})
            f_tag = f_elem.get("tag", "")
            f_content = (f_elem.get("content", "") or "").strip()

            for w_elem in remaining_web[:]:
                w_box = w_elem.get("bounding_box", {})
                w_tag = w_elem.get("tag", "")
                w_content = (w_elem.get("content", "") or "").strip()

                # Same tag
                if f_tag != w_tag:
                    continue

                # Same text content
                if f_content and w_content:
                    if f_content.lower() != w_content.lower():
                        # Check substring match (short text in long text)
                        if f_content.lower() not in w_content.lower() and w_content.lower() not in f_content.lower():
                            continue
                elif f_content or w_content:
                    # One has content, other doesn't — not exact match
                    continue

                # Within position tolerance
                dx = abs((f_box.get("x", 0) or 0) - (w_box.get("x", 0) or 0))
                dy = abs((f_box.get("y", 0) or 0) - (w_box.get("y", 0) or 0))
                if dx > pos_tol or dy > pos_tol:
                    continue

                # Within size tolerance
                dw = abs((f_box.get("width", 0) or 0) - (w_box.get("width", 0) or 0))
                dh = abs((f_box.get("height", 0) or 0) - (w_box.get("height", 0) or 0))
                if dw > size_tol or dh > size_tol:
                    continue

                # Exact match found
                match_entry = ElementMatcher._build_match(f_elem, w_elem, 1.0, {
                    "text_similarity": 1.0,
                    "position_proximity": 1.0,
                    "size_similarity": 1.0,
                    "tag_name_match": 1.0,
                    "type_match": 1.0,
                }, "exact")
                matches.append(match_entry)
                remaining_web.remove(w_elem)
                matched = True
                break

            if not matched:
                remaining_figma.append(f_elem)

        return remaining_figma, remaining_web

    @staticmethod
    def _phase2_heuristic(
        figma_elements: list[dict],
        web_elements: list[dict],
        matches: list,
    ) -> tuple[list, list]:
        """Phase 2: Heuristic match — weighted scoring for remaining elements."""
        remaining_figma = list(figma_elements)
        remaining_web = list(web_elements)

        for f_elem in remaining_figma[:]:
            best_score = 0.0
            best_web = None
            best_factors = None

            f_box = f_elem.get("bounding_box", {})
            f_tag = f_elem.get("tag", "")
            f_type = f_elem.get("type", "")
            f_content = (f_elem.get("content", "") or "").strip()

            for w_elem in remaining_web:
                w_box = w_elem.get("bounding_box", {})
                w_tag = w_elem.get("tag", "")
                w_type = w_elem.get("type", "")
                w_content = (w_elem.get("content", "") or "").strip()

                factors = {}

                # Position proximity
                f_cx = (f_box.get("x", 0) or 0) + (f_box.get("width", 0) or 0) / 2
                f_cy = (f_box.get("y", 0) or 0) + (f_box.get("height", 0) or 0) / 2
                w_cx = (w_box.get("x", 0) or 0) + (w_box.get("width", 0) or 0) / 2
                w_cy = (w_box.get("y", 0) or 0) + (w_box.get("height", 0) or 0) / 2
                dist = math.sqrt((f_cx - w_cx) ** 2 + (f_cy - w_cy) ** 2)
                factors["position_proximity"] = max(0, 1.0 - (dist / 500.0))

                # Size similarity
                f_w = (f_box.get("width", 0) or 0)
                f_h = (f_box.get("height", 0) or 0)
                w_w = (w_box.get("width", 0) or 0)
                w_h = (w_box.get("height", 0) or 0)

                if f_w > 0 and w_w > 0 and f_h > 0 and w_h > 0:
                    w_sim = 1.0 - abs(f_w - w_w) / max(f_w, w_w)
                    h_sim = 1.0 - abs(f_h - w_h) / max(f_h, w_h)
                    factors["size_similarity"] = (w_sim + h_sim) / 2.0
                else:
                    factors["size_similarity"] = 0.0

                # Type match
                types_compatible = ElementMatcher._types_compatible(f_tag, w_tag, f_type, w_type)
                factors["tag_name_match"] = 1.0 if f_tag == w_tag else (0.5 if types_compatible else 0.0)

                # Type match (element type)
                factors["type_match"] = 1.0 if f_type == w_type else 0.0

                # Content similarity
                if f_content and w_content:
                    overlap = len(set(f_content.lower().split()) & set(w_content.lower().split()))
                    total = max(len(set(f_content.lower().split())), 1)
                    factors["text_similarity"] = overlap / total if f_content else 0.0
                else:
                    factors["text_similarity"] = 0.5 if (not f_content and not w_content) else 0.0

                # Weighted score
                score = (
                    W_POSITION * factors["position_proximity"]
                    + W_SIZE * factors["size_similarity"]
                    + W_TYPE * max(factors["tag_name_match"], factors["type_match"])
                    + W_CONTENT * factors["text_similarity"]
                )

                if score > best_score:
                    best_score = score
                    best_web = w_elem
                    best_factors = factors

            # Apply threshold
            if best_score >= AI_REVIEW and best_web:
                match_type = "auto" if best_score >= AUTO_MATCH else "uncertain"
                match_entry = ElementMatcher._build_match(
                    f_elem, best_web, round(best_score, 2), best_factors, match_type
                )
                matches.append(match_entry)
                remaining_figma.remove(f_elem)
                remaining_web.remove(best_web)

        return remaining_figma, remaining_web

    @staticmethod
    def _build_match(
        f_elem: dict,
        w_elem: dict,
        confidence: float,
        factors: dict,
        match_type: str,
    ) -> dict:
        """Build a matched pair entry."""
        return {
            "figma_id": f_elem.get("id", ""),
            "figma_name": f_elem.get("name", ""),
            "web_selector": w_elem.get("id", ""),
            "web_tag": w_elem.get("tag", ""),
            "confidence": confidence,
            "match_type": match_type,
            "matching_factors": factors,
            "figma_element": f_elem,
            "web_element": w_elem,
        }

    @staticmethod
    def _types_compatible(f_tag: str, w_tag: str, f_type: str, w_type: str) -> bool:
        """Check if two element types are compatible (can be matched)."""
        compatible_pairs = [
            ("h1", "h2"), ("h2", "h3"), ("h1", "h3"),
            ("div", "section"), ("div", "article"), ("section", "article"),
            ("span", "p"), ("p", "span"),
            ("li", "span"), ("span", "li"),
            ("input", "textarea"), ("textarea", "input"),
        ]
        return (f_tag, w_tag) in compatible_pairs or (w_tag, f_tag) in compatible_pairs
