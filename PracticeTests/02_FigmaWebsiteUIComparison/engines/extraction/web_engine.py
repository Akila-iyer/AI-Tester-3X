"""Web Extraction Engine — extracts normalized elements from live websites via Playwright."""

import os
import sys
import traceback
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loggers.logger import get_logger

logger = get_logger(__name__)

# JS snippet to extract all visible elements with computed styles
_EXTRACT_JS = """
() => {
    const elements = [];
    const all = document.body.querySelectorAll('*');

    for (const el of all) {
        const rect = el.getBoundingClientRect();

        // Filter: must be visible and have size
        if (rect.width === 0 || rect.height === 0) continue;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        // Build breadcrumb
        const breadcrumb = [];
        let parent = el.parentElement;
        let depth = 0;
        while (parent && parent !== document.body && depth < 5) {
            const tag = parent.tagName.toLowerCase();
            const cls = parent.className && typeof parent.className === 'string'
                ? parent.className.split(' ').slice(0, 2).join('.')
                : '';
            breadcrumb.unshift(tag + (cls ? '.' + cls : ''));
            parent = parent.parentElement;
            depth++;
        }

        elements.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_name: (el.className && typeof el.className === 'string') ? el.className : '',
            bounding_box: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            },
            styles: {
                font_family: style.fontFamily,
                font_size: style.fontSize,
                font_weight: style.fontWeight,
                line_height: style.lineHeight,
                letter_spacing: style.letterSpacing,
                text_align: style.textAlign,
                text_transform: style.textTransform,
                text_decoration: style.textDecoration,
                color: style.color,
                background_color: style.backgroundColor,
                border_color: style.borderColor || style.borderTopColor,
                border_width: style.borderWidth,
                border_radius: style.borderRadius,
                border_style: style.borderStyle,
                margin_top: style.marginTop,
                margin_right: style.marginRight,
                margin_bottom: style.marginBottom,
                margin_left: style.marginLeft,
                padding_top: style.paddingTop,
                padding_right: style.paddingRight,
                padding_bottom: style.paddingBottom,
                padding_left: style.paddingLeft,
                display: style.display,
                opacity: style.opacity,
                overflow: style.overflow,
                z_index: style.zIndex,
                box_shadow: style.boxShadow,
                flex_direction: style.flexDirection,
                justify_content: style.justifyContent,
                align_items: style.alignItems,
                gap: style.gap,
                transform: style.transform,
                cursor: style.cursor,
            },
            content: (el.innerText || '').substring(0, 500),
            aria: {
                role: el.getAttribute('role') || '',
                aria_label: el.getAttribute('aria-label') || null,
                aria_labelledby: el.getAttribute('aria-labelledby') || null,
            },
            attributes: {
                alt: el.getAttribute('alt') || null,
                href: el.getAttribute('href') || null,
                src: el.getAttribute('src') || null,
                tabindex: el.getAttribute('tabindex') || null,
            },
            hierarchy: {
                breadcrumb: breadcrumb,
                depth: breadcrumb.length,
            },
        });
    }
    return elements;
}
"""


class WebExtractor:
    """Extracts normalized elements and screenshots from a live website."""

    @staticmethod
    def extract(url: str, viewports: list[dict] = None) -> dict:
        """Extract elements from a website at one or more viewport sizes.

        Args:
            url: Target website URL.
            viewports: List of viewport configs with name, width, height.
                       Defaults to [{"name": "Desktop", "width": 1920, "height": 1080}].

        Returns:
            Dict mapping viewport names to extraction results:
            {
                "desktop": {
                    "status": "OK",
                    "elements": [NormalizedElement, ...],
                    "screenshot_path": ".tmp/sessions/{id}/screenshots/web_desktop.png",
                    "error": None
                },
                ...
            }
        """
        if viewports is None:
            viewports = [{"name": "Desktop", "width": 1920, "height": 1080}]

        results = {}

        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.error("playwright package not installed")
            for vp in viewports:
                results[vp["name"]] = {
                    "status": "FAIL",
                    "elements": [],
                    "screenshot_path": None,
                    "error": "playwright package not installed",
                }
            return results

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                for vp in viewports:
                    vp_name = vp.get("name", "Unknown")
                    try:
                        result = WebExtractor._extract_viewport(
                            browser, url, vp_name, vp["width"], vp["height"]
                        )
                        results[vp_name] = result
                    except Exception as e:
                        logger.error("Viewport %s failed: %s", vp_name, traceback.format_exc())
                        results[vp_name] = {
                            "status": "FAIL",
                            "elements": [],
                            "screenshot_path": None,
                            "error": str(e),
                        }
                browser.close()
        except Exception as e:
            logger.error("Playwright launch failed: %s", traceback.format_exc())
            for vp in viewports:
                if vp["name"] not in results:
                    results[vp["name"]] = {
                        "status": "FAIL",
                        "elements": [],
                        "screenshot_path": None,
                        "error": str(e),
                    }

        return results

    @staticmethod
    def _extract_viewport(
        browser, url: str, vp_name: str, width: int, height: int
    ) -> dict:
        """Extract elements for a single viewport size."""
        context = browser.new_context(
            viewport={"width": width, "height": height},
            user_agent="VisualUITestingBot/1.0",
        )
        page = context.new_page()

        logger.info("Navigating to %s (%s: %dx%d)", url, vp_name, width, height)
        page.goto(url, wait_until="networkidle", timeout=30000)

        # Extract title
        title = page.title()

        # Extract elements via JS
        raw_elements = page.evaluate(_EXTRACT_JS)

        # Normalize to our schema
        elements = []
        for raw in raw_elements:
            elem = WebExtractor._normalize_element(raw, vp_name)
            if elem:
                elements.append(elem)

        # Take screenshot
        screenshot_path = None
        try:
            screenshot_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                ".tmp",
                "screenshots",
            )
            os.makedirs(screenshot_dir, exist_ok=True)
            screenshot_name = f"web_{vp_name.lower()}.png"
            screenshot_path = os.path.join(screenshot_dir, screenshot_name)
            page.screenshot(path=screenshot_path, full_page=True)
            logger.info("Screenshot saved: %s", screenshot_path)
        except Exception as e:
            logger.warning("Screenshot failed for %s: %s", vp_name, e)

        context.close()

        logger.info(
            "Extracted %d elements from %s (%s)", len(elements), url, vp_name
        )

        return {
            "status": "OK",
            "title": title,
            "elements": elements,
            "screenshot_path": screenshot_path,
            "error": None,
        }

    @staticmethod
    def _normalize_element(raw: dict, viewport: str) -> Optional[dict]:
        """Convert raw JS extraction dict to NormalizedElement format."""
        try:
            bbox = raw.get("bounding_box", {})
            styles = raw.get("styles", {})
            aria = raw.get("aria", {})
            attrs = raw.get("attributes", {})
            tag = raw.get("tag", "div")

            # Parse computed CSS values to numbers
            font_size = WebExtractor._parse_px(styles.get("font_size", "16px"))
            line_height_str = styles.get("line_height", "normal")
            if line_height_str == "normal":
                line_height = font_size * 1.2
            else:
                line_height = WebExtractor._parse_px(line_height_str)

            # Parse color strings (rgb/rgba -> dict)
            text_color = WebExtractor._parse_color(styles.get("color", ""))
            bg_color = WebExtractor._parse_color(styles.get("background_color", ""))
            border_color = WebExtractor._parse_color(styles.get("border_color", ""))

            # Infer heading level
            heading_level = 0
            if tag.startswith("h") and len(tag) == 2 and tag[1].isdigit():
                heading_level = int(tag[1])

            # Map accessibility role
            role = aria.get("role", "")
            if not role:
                if tag == "nav":
                    role = "navigation"
                elif tag == "footer":
                    role = "contentinfo"
                elif tag == "header":
                    role = "banner"
                elif tag == "form":
                    role = "form"
                elif tag == "img":
                    role = "img"
                elif tag == "button":
                    role = "button"
                elif tag == "input":
                    role = "textbox"
                elif tag == "a":
                    role = "link"

            element = {
                "source": "web",
                "id": f"web:{viewport}:{raw.get('tag', '')}:{int(bbox.get('x', 0))}:{int(bbox.get('y', 0))}",
                "name": raw.get("id", "") or raw.get("class_name", "").split()[0] if raw.get("class_name") else tag,
                "type": WebExtractor._map_tag_to_type(tag),
                "tag": tag,
                "viewport": viewport,
                "bounding_box": {
                    "x": bbox.get("x", 0),
                    "y": bbox.get("y", 0),
                    "width": bbox.get("width", 0),
                    "height": bbox.get("height", 0),
                },
                "styles": {
                    "typography": {
                        "font_family": styles.get("font_family", ""),
                        "font_size": font_size,
                        "font_weight": WebExtractor._parse_int(styles.get("font_weight", "400")),
                        "letter_spacing": WebExtractor._parse_px(styles.get("letter_spacing", "0px")),
                        "line_height": round(line_height, 1),
                        "text_align": styles.get("text_align", "left"),
                        "text_decoration": styles.get("text_decoration", "none"),
                        "text_transform": styles.get("text_transform", "none"),
                    },
                    "colors": {
                        "color": text_color,
                        "background_color": bg_color,
                        "border_color": border_color,
                        "opacity": WebExtractor._parse_float(styles.get("opacity", "1")),
                        "box_shadow": styles.get("box_shadow", None),
                    },
                    "layout": {
                        "margin": {
                            "top": WebExtractor._parse_px(styles.get("margin_top", "0px")),
                            "right": WebExtractor._parse_px(styles.get("margin_right", "0px")),
                            "bottom": WebExtractor._parse_px(styles.get("margin_bottom", "0px")),
                            "left": WebExtractor._parse_px(styles.get("margin_left", "0px")),
                        },
                        "padding": {
                            "top": WebExtractor._parse_px(styles.get("padding_top", "0px")),
                            "right": WebExtractor._parse_px(styles.get("padding_right", "0px")),
                            "bottom": WebExtractor._parse_px(styles.get("padding_bottom", "0px")),
                            "left": WebExtractor._parse_px(styles.get("padding_left", "0px")),
                        },
                        "border_radius": WebExtractor._parse_px(styles.get("border_radius", "0px")),
                        "border_width": WebExtractor._parse_px(styles.get("border_width", "0px")),
                        "display": styles.get("display", "block"),
                        "flex_direction": styles.get("flex_direction", None) if styles.get("flex_direction") != "none" else None,
                        "justify_content": styles.get("justify_content", None) if styles.get("justify_content") != "normal" else None,
                        "align_items": styles.get("align_items", None) if styles.get("align_items") != "normal" else None,
                        "z_index": WebExtractor._parse_int(styles.get("z_index", "auto")),
                        "overflow": styles.get("overflow", "visible"),
                    },
                },
                "content": raw.get("content", ""),
                "hierarchy": {
                    "parent_id": "",
                    "children": [],
                    "depth": raw.get("hierarchy", {}).get("depth", 0),
                    "breadcrumb": raw.get("hierarchy", {}).get("breadcrumb", []),
                },
                "accessibility": {
                    "role": role,
                    "aria_label": aria.get("aria_label"),
                    "aria_labelledby": aria.get("aria_labelledby"),
                    "alt_text": attrs.get("alt"),
                    "tab_index": WebExtractor._parse_int(attrs.get("tabindex", "0")),
                    "heading_level": heading_level,
                },
            }

            return element
        except Exception as e:
            logger.warning("Failed to normalize element: %s | %s", raw.get("tag", "?"), e)
            return None

    @staticmethod
    def _parse_px(value: str) -> float:
        """Parse a CSS px value to float."""
        if not value or value == "none" or value == "normal" or value == "auto":
            return 0
        if isinstance(value, (int, float)):
            return float(value)
        try:
            return float(value.replace("px", "").strip())
        except (ValueError, AttributeError):
            return 0

    @staticmethod
    def _parse_int(value) -> int:
        """Parse an int value, handling CSS keywords."""
        if isinstance(value, (int, float)):
            return int(value)
        if not value or value == "auto" or value == "none":
            return 0
        try:
            return int(float(value.replace("px", "").strip()))
        except (ValueError, AttributeError):
            return 0

    @staticmethod
    def _parse_float(value) -> float:
        """Parse a float value."""
        if isinstance(value, (int, float)):
            return float(value)
        if not value or value == "none" or value == "auto":
            return 1.0
        try:
            return float(value)
        except (ValueError, AttributeError):
            return 1.0

    @staticmethod
    def _parse_color(color_str: str) -> Optional[dict]:
        """Parse CSS rgb/rgba string to {r, g, b, a} dict."""
        if not color_str or color_str == "none" or color_str == "transparent" or color_str.startswith("rgba(0, 0, 0, 0)"):
            return None

        try:
            if color_str.startswith("rgba"):
                parts = color_str.replace("rgba(", "").replace(")", "").split(",")
                return {
                    "r": int(parts[0].strip()),
                    "g": int(parts[1].strip()),
                    "b": int(parts[2].strip()),
                    "a": float(parts[3].strip()),
                }
            elif color_str.startswith("rgb"):
                parts = color_str.replace("rgb(", "").replace(")", "").split(",")
                return {
                    "r": int(parts[0].strip()),
                    "g": int(parts[1].strip()),
                    "b": int(parts[2].strip()),
                    "a": 1.0,
                }
        except (ValueError, IndexError, AttributeError):
            pass

        return None

    @staticmethod
    def _map_tag_to_type(tag: str) -> str:
        """Map HTML tag to normalized element type."""
        type_map = {
            "img": "image",
            "button": "button",
            "input": "input",
            "select": "input",
            "textarea": "input",
            "h1": "text",
            "h2": "text",
            "h3": "text",
            "h4": "text",
            "h5": "text",
            "h6": "text",
            "p": "text",
            "span": "text",
            "a": "text",
            "label": "text",
            "li": "text",
            "nav": "frame",
            "header": "frame",
            "footer": "frame",
            "section": "frame",
            "article": "frame",
            "aside": "frame",
            "div": "frame",
            "form": "frame",
            "ul": "group",
            "ol": "group",
            "table": "group",
            "hr": "rectangle",
            "br": "rectangle",
        }
        return type_map.get(tag, "frame")
