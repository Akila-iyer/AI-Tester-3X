"""Figma Extraction Engine — extracts normalized elements from Figma API or mock data."""

import json
import os
import re
import sys
import traceback
from typing import Optional

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loggers.logger import get_logger

logger = get_logger(__name__)

FIGMA_API_BASE = "https://api.figma.com/v1"

TYPE_MAP = {
    "TEXT": "text",
    "RECTANGLE": "rectangle",
    "FRAME": "frame",
    "COMPONENT": "component",
    "INSTANCE": "component",
    "GROUP": "group",
    "VECTOR": "vector",
    "LINE": "vector",
    "ELLIPSE": "ellipse",
    "BOOLEAN_OPERATION": "group",
    "STAR": "vector",
    "POLYGON": "vector",
}


class FigmaExtractor:
    """Extracts and normalizes elements from a Figma file."""

    @staticmethod
    def extract(figma_url: str, token: str = "") -> list[dict]:
        """Extract normalized elements from a Figma file.

        Args:
            figma_url: Full Figma file URL (e.g. https://www.figma.com/file/KEY/name).
            token: Figma Personal Access Token. If empty, falls back to mock mode.

        Returns:
            List of NormalizedElement dicts.
        """
        file_key = FigmaExtractor._parse_file_key(figma_url)
        if not file_key:
            logger.warning("Could not parse Figma file key from URL: %s", figma_url)
            return FigmaExtractor._generate_mock_elements()

        if not token:
            logger.info("No Figma token provided — using mock elements")
            return FigmaExtractor._generate_mock_elements()

        try:
            elements = FigmaExtractor._fetch_and_parse(file_key, token)
            if elements is not None:
                return elements
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 403:
                logger.warning("Figma API 403 (invalid token) — falling back to mock mode")
            else:
                logger.error("Figma API HTTP error: %s", e)
        except Exception as e:
            logger.error("Figma API error: %s", traceback.format_exc())

        return FigmaExtractor._generate_mock_elements()

    @staticmethod
    def _parse_file_key(url: str) -> Optional[str]:
        """Extract file key from a Figma URL."""
        match = re.search(r"/file/([a-zA-Z0-9]+)/?", url)
        return match.group(1) if match else None

    @staticmethod
    def _fetch_and_parse(file_key: str, token: str) -> Optional[list[dict]]:
        """Fetch Figma file JSON and parse into normalized elements."""
        url = f"{FIGMA_API_BASE}/files/{file_key}"
        headers = {"X-Figma-Token": token}

        logger.info("Fetching Figma file: %s", file_key)
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()

        data = resp.json()
        document = data.get("document", {})
        elements = []
        FigmaExtractor._walk_nodes(document, elements, depth=0, breadcrumb=[])

        logger.info("Extracted %d elements from Figma file", len(elements))
        return elements

    @staticmethod
    def _walk_nodes(
        node: dict,
        elements: list,
        depth: int = 0,
        breadcrumb: list = None,
        parent_id: str = None,
    ):
        """Recursively walk Figma node tree and normalize elements."""
        if breadcrumb is None:
            breadcrumb = []

        node_id = node.get("id", "")
        node_name = node.get("name", "")
        node_type = node.get("type", "")
        children = node.get("children", [])

        # Process this node if it's a leaf or has meaningful content
        if node_type not in ("DOCUMENT", "CANVAS"):
            element = FigmaExtractor._normalize_node(
                node, depth, breadcrumb, parent_id
            )
            if element:
                elements.append(element)

        # Recurse into children
        child_breadcrumb = breadcrumb + [node_name]
        for child in children:
            FigmaExtractor._walk_nodes(
                child, elements, depth + 1, child_breadcrumb, node_id
            )

    @staticmethod
    def _normalize_node(
        node: dict, depth: int, breadcrumb: list, parent_id: Optional[str]
    ) -> Optional[dict]:
        """Convert a Figma node dict to NormalizedElement format."""
        node_type = node.get("type", "")
        if node_type in ("DOCUMENT", "CANVAS"):
            return None

        abs_box = node.get("absoluteBoundingBox", {}) or {}
        style = node.get("style", {}) or {}
        fills = node.get("fills", []) or []
        strokes = node.get("strokes", []) or []

        # Type mapping
        normalized_type = TYPE_MAP.get(node_type, "rectangle")

        # Tag inference
        tag = FigmaExtractor._infer_tag(normalized_type, node)

        # Extract colors from fills
        text_color = None
        bg_color = None
        for fill in fills:
            fill_type = fill.get("type", "")
            color_data = fill.get("color")
            if color_data and fill_type == "SOLID":
                rgba = FigmaExtractor._normalize_color(color_data)
                if fill.get("fillGeometry"):
                    text_color = rgba
                else:
                    bg_color = rgba
                if text_color is None:
                    text_color = rgba

        # Extract stroke/border color
        border_color = None
        for stroke in strokes:
            color_data = stroke.get("color")
            if color_data:
                border_color = FigmaExtractor._normalize_color(color_data)
                break

        # Typography
        typography = {
            "font_family": style.get("fontFamily", ""),
            "font_size": style.get("fontSize", 16),
            "font_weight": style.get("fontWeight", 400),
            "letter_spacing": style.get("letterSpacing", 0),
            "line_height": style.get("lineHeightPx", style.get("lineHeightPercentFontSize", 120) / 100 * (style.get("fontSize", 16) or 16)),
            "text_align": style.get("textAlign", "left"),
            "text_decoration": "none",
            "text_transform": "none",
        }

        # Layout
        layout = {
            "margin": {"top": 0, "right": 0, "bottom": 0, "left": 0},
            "padding": {
                "top": node.get("paddingTop", 0),
                "right": node.get("paddingRight", 0),
                "bottom": node.get("paddingBottom", 0),
                "left": node.get("paddingLeft", 0),
            },
            "border_radius": max(
                node.get("cornerRadius", 0) or 0,
                max(
                    node.get("topLeftRadius", 0) or 0,
                    node.get("topRightRadius", 0) or 0,
                    node.get("bottomLeftRadius", 0) or 0,
                    node.get("bottomRightRadius", 0) or 0,
                ),
            ),
            "border_width": node.get("strokeWeight", 0) or 0,
            "display": "flex" if node.get("layoutMode") else "block",
            "flex_direction": "row" if node.get("layoutMode") == "HORIZONTAL" else ("column" if node.get("layoutMode") == "VERTICAL" else None),
            "justify_content": node.get("primaryAxisAlignItems", "").lower() if node.get("layoutMode") else None,
            "align_items": node.get("counterAxisAlignItems", "").lower() if node.get("layoutMode") else None,
            "z_index": 0,
            "overflow": "visible",
        }

        # Opacity
        opacity = node.get("opacity", 1.0) or 1.0

        element = {
            "source": "figma",
            "id": node.get("id", ""),
            "name": node.get("name", ""),
            "type": normalized_type,
            "tag": tag,
            "bounding_box": {
                "x": abs_box.get("x", 0),
                "y": abs_box.get("y", 0),
                "width": abs_box.get("width", 0),
                "height": abs_box.get("height", 0),
            },
            "styles": {
                "typography": typography,
                "colors": {
                    "color": text_color,
                    "background_color": bg_color,
                    "border_color": border_color,
                    "opacity": opacity,
                    "box_shadow": None,
                },
                "layout": layout,
            },
            "content": node.get("characters", ""),
            "hierarchy": {
                "parent_id": parent_id or "",
                "children": [c.get("id", "") for c in node.get("children", [])],
                "depth": depth,
                "breadcrumb": breadcrumb,
            },
            "accessibility": {
                "role": "",
                "aria_label": None,
                "aria_labelledby": None,
                "alt_text": None,
                "tab_index": 0,
                "heading_level": 1 if tag == "h1" else (2 if tag == "h2" else 0),
            },
        }

        return element

    @staticmethod
    def _infer_tag(normalized_type: str, node: dict) -> str:
        """Infer HTML tag from Figma node properties."""
        node_type = node.get("type", "")
        node_name = node.get("name", "").lower()

        if normalized_type == "text":
            font_size = (node.get("style", {}) or {}).get("fontSize", 16) or 16
            if font_size >= 32:
                return "h1"
            elif font_size >= 24:
                return "h2"
            elif font_size >= 18:
                return "h3"
            return "p"

        if normalized_type == "component":
            if any(kw in node_name for kw in ["button", "btn", "cta"]):
                return "button"
            if any(kw in node_name for kw in ["input", "field", "textbox"]):
                return "input"
            if any(kw in node_name for kw in ["card", "tile"]):
                return "div"

        if normalized_type == "frame":
            if any(kw in node_name for kw in ["nav", "header", "navbar"]):
                return "nav"
            if any(kw in node_name for kw in ["footer"]):
                return "footer"
            if any(kw in node_name for kw in ["section"]):
                return "section"
            if any(kw in node_name for kw in ["form"]):
                return "form"

        if normalized_type == "rectangle":
            return "div"

        return "div"

    @staticmethod
    def _normalize_color(color_data: dict) -> dict:
        """Convert Figma RGBA (0-1 range) to 0-255 range."""
        r = round((color_data.get("r", 0) or 0) * 255)
        g = round((color_data.get("g", 0) or 0) * 255)
        b = round((color_data.get("b", 0) or 0) * 255)
        a = color_data.get("a", 1) or 1
        return {"r": r, "g": g, "b": b, "a": round(a, 2)}

    @staticmethod
    def _generate_mock_elements() -> list[dict]:
        """Generate realistic mock elements for testing without Figma credentials."""
        logger.info("Generating 18 mock Figma elements")
        return [
            {
                "source": "figma",
                "id": "mock:1:1",
                "name": "Navigation Bar",
                "type": "frame",
                "tag": "nav",
                "bounding_box": {"x": 0, "y": 0, "width": 1440, "height": 72},
                "styles": {
                    "typography": {"font_family": "Inter", "font_size": 14, "font_weight": 500, "letter_spacing": 0, "line_height": 20, "text_align": "left", "text_decoration": "none", "text_transform": "none"},
                    "colors": {"color": {"r": 255, "g": 255, "b": 255, "a": 1.0}, "background_color": {"r": 26, "g": 26, "b": 46, "a": 1.0}, "border_color": None, "opacity": 1.0, "box_shadow": None},
                    "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "padding": {"top": 16, "right": 32, "bottom": 16, "left": 32}, "border_radius": 0, "border_width": 0, "display": "flex", "flex_direction": "row", "justify_content": "space-between", "align_items": "center", "z_index": 100, "overflow": "visible"},
                },
                "content": "Logo | Home | Features | Pricing | Contact | Get Started",
                "hierarchy": {"parent_id": "", "children": [], "depth": 0, "breadcrumb": ["Navigation Bar"]},
                "accessibility": {"role": "navigation", "aria_label": "Main navigation", "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:2:1", "name": "Hero Heading", "type": "text", "tag": "h1",
                "bounding_box": {"x": 220, "y": 160, "width": 1000, "height": 60},
                "styles": {"typography": {"font_family": "Inter", "font_size": 48, "font_weight": 700, "letter_spacing": -1, "line_height": 60, "text_align": "center", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 26, "g": 26, "b": 46, "a": 1.0}, "background_color": None, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 16, "left": 0}, "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "border_radius": 0, "border_width": 0, "display": "block", "flex_direction": None, "justify_content": None, "align_items": None, "z_index": 1, "overflow": "visible"}},
                "content": "Welcome to Our Platform", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Hero Heading"]},
                "accessibility": {"role": "heading", "aria_label": None, "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 1},
            },
            {
                "source": "figma", "id": "mock:2:2", "name": "Hero Subheading", "type": "text", "tag": "h2",
                "bounding_box": {"x": 320, "y": 236, "width": 800, "height": 32},
                "styles": {"typography": {"font_family": "Inter", "font_size": 24, "font_weight": 400, "letter_spacing": 0, "line_height": 32, "text_align": "center", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 107, "g": 114, "b": 128, "a": 1.0}, "background_color": None, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 32, "left": 0}, "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "border_radius": 0, "border_width": 0, "display": "block", "flex_direction": None, "justify_content": None, "align_items": None, "z_index": 1, "overflow": "visible"}},
                "content": "Your journey starts here. Build something amazing with our platform.", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Hero Subheading"]},
                "accessibility": {"role": "heading", "aria_label": None, "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 2},
            },
            {
                "source": "figma", "id": "mock:3:1", "name": "Primary Button", "type": "text", "tag": "button",
                "bounding_box": {"x": 570, "y": 300, "width": 180, "height": 48},
                "styles": {"typography": {"font_family": "Inter", "font_size": 16, "font_weight": 600, "letter_spacing": 0, "line_height": 24, "text_align": "center", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 255, "g": 255, "b": 255, "a": 1.0}, "background_color": {"r": 79, "g": 70, "b": 229, "a": 1.0}, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 12, "bottom": 0, "left": 0}, "padding": {"top": 12, "right": 24, "bottom": 12, "left": 24}, "border_radius": 8, "border_width": 0, "display": "inline-flex", "flex_direction": None, "justify_content": "center", "align_items": "center", "z_index": 1, "overflow": "visible"}},
                "content": "Get Started", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Primary Button"]},
                "accessibility": {"role": "button", "aria_label": "Get Started", "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:3:2", "name": "Secondary Button", "type": "text", "tag": "button",
                "bounding_box": {"x": 770, "y": 300, "width": 180, "height": 48},
                "styles": {"typography": {"font_family": "Inter", "font_size": 16, "font_weight": 600, "letter_spacing": 0, "line_height": 24, "text_align": "center", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 79, "g": 70, "b": 229, "a": 1.0}, "background_color": {"r": 255, "g": 255, "b": 255, "a": 1.0}, "border_color": {"r": 79, "g": 70, "b": 229, "a": 1.0}, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 12}, "padding": {"top": 12, "right": 24, "bottom": 12, "left": 24}, "border_radius": 8, "border_width": 2, "display": "inline-flex", "flex_direction": None, "justify_content": "center", "align_items": "center", "z_index": 1, "overflow": "visible"}},
                "content": "Learn More", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Secondary Button"]},
                "accessibility": {"role": "button", "aria_label": "Learn More", "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:4:1", "name": "Body Text", "type": "text", "tag": "p",
                "bounding_box": {"x": 220, "y": 380, "width": 1000, "height": 48},
                "styles": {"typography": {"font_family": "Inter", "font_size": 16, "font_weight": 400, "letter_spacing": 0, "line_height": 24, "text_align": "center", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 75, "g": 85, "b": 99, "a": 1.0}, "background_color": None, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 64, "left": 0}, "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "border_radius": 0, "border_width": 0, "display": "block", "flex_direction": None, "justify_content": None, "align_items": None, "z_index": 1, "overflow": "visible"}},
                "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Body Text"]},
                "accessibility": {"role": "", "aria_label": None, "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:5:1", "name": "Hero Image Placeholder", "type": "rectangle", "tag": "img",
                "bounding_box": {"x": 320, "y": 460, "width": 800, "height": 400},
                "styles": {"typography": {"font_family": "", "font_size": 0, "font_weight": 0, "letter_spacing": 0, "line_height": 0, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": None, "background_color": {"r": 243, "g": 244, "b": 246, "a": 1.0}, "border_color": {"r": 209, "g": 213, "b": 219, "a": 1.0}, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 64, "left": 0}, "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "border_radius": 12, "border_width": 1, "display": "block", "flex_direction": None, "justify_content": None, "align_items": None, "z_index": 1, "overflow": "hidden"}},
                "content": "", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Hero Image Placeholder"]},
                "accessibility": {"role": "img", "aria_label": "Hero image showcasing the platform", "aria_labelledby": None, "alt_text": "Hero image showcasing the platform", "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:6:1", "name": "Feature Card 1", "type": "frame", "tag": "div",
                "bounding_box": {"x": 120, "y": 960, "width": 360, "height": 260},
                "styles": {"typography": {"font_family": "Inter", "font_size": 14, "font_weight": 400, "letter_spacing": 0, "line_height": 20, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 75, "g": 85, "b": 99, "a": 1.0}, "background_color": {"r": 255, "g": 255, "b": 255, "a": 1.0}, "border_color": {"r": 229, "g": 231, "b": 235, "a": 1.0}, "opacity": 1.0, "box_shadow": "0 4px 6px rgba(0,0,0,0.1)"}, "layout": {"margin": {"top": 0, "right": 20, "bottom": 0, "left": 0}, "padding": {"top": 24, "right": 24, "bottom": 24, "left": 24}, "border_radius": 12, "border_width": 1, "display": "flex", "flex_direction": "column", "justify_content": "flex-start", "align_items": "center", "z_index": 1, "overflow": "visible"}},
                "content": "Lightning Fast", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Feature Card 1"]},
                "accessibility": {"role": "", "aria_label": None, "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:6:2", "name": "Feature Card 2", "type": "frame", "tag": "div",
                "bounding_box": {"x": 540, "y": 960, "width": 360, "height": 260},
                "styles": {"typography": {"font_family": "Inter", "font_size": 14, "font_weight": 400, "letter_spacing": 0, "line_height": 20, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 75, "g": 85, "b": 99, "a": 1.0}, "background_color": {"r": 255, "g": 255, "b": 255, "a": 1.0}, "border_color": {"r": 229, "g": 231, "b": 235, "a": 1.0}, "opacity": 1.0, "box_shadow": "0 4px 6px rgba(0,0,0,0.1)"}, "layout": {"margin": {"top": 0, "right": 20, "bottom": 0, "left": 0}, "padding": {"top": 24, "right": 24, "bottom": 24, "left": 24}, "border_radius": 12, "border_width": 1, "display": "flex", "flex_direction": "column", "justify_content": "flex-start", "align_items": "center", "z_index": 1, "overflow": "visible"}},
                "content": "Pixel Perfect", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Feature Card 2"]},
                "accessibility": {"role": "", "aria_label": None, "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:6:3", "name": "Feature Card 3", "type": "frame", "tag": "div",
                "bounding_box": {"x": 960, "y": 960, "width": 360, "height": 260},
                "styles": {"typography": {"font_family": "Inter", "font_size": 14, "font_weight": 400, "letter_spacing": 0, "line_height": 20, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 75, "g": 85, "b": 99, "a": 1.0}, "background_color": {"r": 255, "g": 255, "b": 255, "a": 1.0}, "border_color": {"r": 229, "g": 231, "b": 235, "a": 1.0}, "opacity": 1.0, "box_shadow": "0 4px 6px rgba(0,0,0,0.1)"}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "padding": {"top": 24, "right": 24, "bottom": 24, "left": 24}, "border_radius": 12, "border_width": 1, "display": "flex", "flex_direction": "column", "justify_content": "flex-start", "align_items": "center", "z_index": 1, "overflow": "visible"}},
                "content": "AI-Powered", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Feature Card 3"]},
                "accessibility": {"role": "", "aria_label": None, "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:7:1", "name": "Footer", "type": "frame", "tag": "footer",
                "bounding_box": {"x": 0, "y": 1360, "width": 1440, "height": 200},
                "styles": {"typography": {"font_family": "Inter", "font_size": 14, "font_weight": 400, "letter_spacing": 0, "line_height": 20, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 156, "g": 163, "b": 175, "a": 1.0}, "background_color": {"r": 26, "g": 26, "b": 46, "a": 1.0}, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "padding": {"top": 48, "right": 120, "bottom": 48, "left": 120}, "border_radius": 0, "border_width": 0, "display": "flex", "flex_direction": "row", "justify_content": "space-between", "align_items": "flex-start", "z_index": 1, "overflow": "visible"}},
                "content": "Product | Company | Support | Copyright 2026", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Footer"]},
                "accessibility": {"role": "contentinfo", "aria_label": "Footer", "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:8:1", "name": "Form Container", "type": "frame", "tag": "form",
                "bounding_box": {"x": 420, "y": 900, "width": 600, "height": 48},
                "styles": {"typography": {"font_family": "Inter", "font_size": 14, "font_weight": 400, "letter_spacing": 0, "line_height": 20, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 75, "g": 85, "b": 99, "a": 1.0}, "background_color": None, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "border_radius": 0, "border_width": 0, "display": "flex", "flex_direction": "row", "justify_content": "flex-start", "align_items": "center", "z_index": 1, "overflow": "visible"}},
                "content": "Email input", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Form Container"]},
                "accessibility": {"role": "form", "aria_label": "Newsletter signup", "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:8:2", "name": "Email Input", "type": "rectangle", "tag": "input",
                "bounding_box": {"x": 420, "y": 900, "width": 400, "height": 48},
                "styles": {"typography": {"font_family": "Inter", "font_size": 16, "font_weight": 400, "letter_spacing": 0, "line_height": 24, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 107, "g": 114, "b": 128, "a": 1.0}, "background_color": {"r": 255, "g": 255, "b": 255, "a": 1.0}, "border_color": {"r": 209, "g": 213, "b": 219, "a": 1.0}, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "padding": {"top": 12, "right": 16, "bottom": 12, "left": 16}, "border_radius": 8, "border_width": 1, "display": "block", "flex_direction": None, "justify_content": None, "align_items": None, "z_index": 1, "overflow": "visible"}},
                "content": "", "hierarchy": {"parent_id": "", "children": [], "depth": 2, "breadcrumb": ["Form Container", "Email Input"]},
                "accessibility": {"role": "textbox", "aria_label": "Email address", "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:8:3", "name": "Submit Button", "type": "rectangle", "tag": "button",
                "bounding_box": {"x": 820, "y": 900, "width": 200, "height": 48},
                "styles": {"typography": {"font_family": "Inter", "font_size": 16, "font_weight": 600, "letter_spacing": 0, "line_height": 24, "text_align": "center", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 255, "g": 255, "b": 255, "a": 1.0}, "background_color": {"r": 79, "g": 70, "b": 229, "a": 1.0}, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "padding": {"top": 12, "right": 24, "bottom": 12, "left": 24}, "border_radius": 8, "border_width": 0, "display": "inline-flex", "flex_direction": None, "justify_content": "center", "align_items": "center", "z_index": 1, "overflow": "visible"}},
                "content": "Subscribe", "hierarchy": {"parent_id": "", "children": [], "depth": 2, "breadcrumb": ["Form Container", "Submit Button"]},
                "accessibility": {"role": "button", "aria_label": "Subscribe to newsletter", "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:9:1", "name": "Logo", "type": "rectangle", "tag": "img",
                "bounding_box": {"x": 32, "y": 16, "width": 120, "height": 40},
                "styles": {"typography": {"font_family": "", "font_size": 0, "font_weight": 0, "letter_spacing": 0, "line_height": 0, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": None, "background_color": {"r": 79, "g": 70, "b": 229, "a": 1.0}, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "border_radius": 4, "border_width": 0, "display": "block", "flex_direction": None, "justify_content": None, "align_items": None, "z_index": 1, "overflow": "visible"}},
                "content": "", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Logo"]},
                "accessibility": {"role": "img", "aria_label": "Company logo", "aria_labelledby": None, "alt_text": "Company logo", "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:10:1", "name": "Testimonial Section", "type": "frame", "tag": "section",
                "bounding_box": {"x": 120, "y": 1280, "width": 1200, "height": 120},
                "styles": {"typography": {"font_family": "Inter", "font_size": 18, "font_weight": 400, "letter_spacing": 0, "line_height": 28, "text_align": "center", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": {"r": 75, "g": 85, "b": 99, "a": 1.0}, "background_color": {"r": 249, "g": 250, "b": 251, "a": 1.0}, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "padding": {"top": 40, "right": 40, "bottom": 40, "left": 40}, "border_radius": 0, "border_width": 0, "display": "flex", "flex_direction": "column", "justify_content": "center", "align_items": "center", "z_index": 1, "overflow": "visible"}},
                "content": '"This platform transformed our workflow. The visual comparison is incredibly accurate." — Happy Customer', "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Testimonial Section"]},
                "accessibility": {"role": "", "aria_label": None, "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
            {
                "source": "figma", "id": "mock:11:1", "name": "Divider", "type": "rectangle", "tag": "hr",
                "bounding_box": {"x": 220, "y": 920, "width": 1000, "height": 1},
                "styles": {"typography": {"font_family": "", "font_size": 0, "font_weight": 0, "letter_spacing": 0, "line_height": 0, "text_align": "left", "text_decoration": "none", "text_transform": "none"}, "colors": {"color": None, "background_color": {"r": 229, "g": 231, "b": 235, "a": 1.0}, "border_color": None, "opacity": 1.0, "box_shadow": None}, "layout": {"margin": {"top": 32, "right": 0, "bottom": 32, "left": 0}, "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "border_radius": 0, "border_width": 0, "display": "block", "flex_direction": None, "justify_content": None, "align_items": None, "z_index": 1, "overflow": "visible"}},
                "content": "", "hierarchy": {"parent_id": "", "children": [], "depth": 1, "breadcrumb": ["Divider"]},
                "accessibility": {"role": "separator", "aria_label": None, "aria_labelledby": None, "alt_text": None, "tab_index": 0, "heading_level": 0},
            },
        ]
