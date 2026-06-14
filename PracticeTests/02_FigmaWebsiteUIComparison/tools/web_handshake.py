"""Web Extraction Handshake -- Verify Playwright can launch, navigate, and extract."""

import os
import sys
import json
import traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

TEST_URL = "https://example.com"


def check_playwright() -> dict:
    """Test Playwright: launch browser, navigate, extract title + meta."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"status": "FAIL", "error": "playwright package not installed"}

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="VisualUITestingBot/1.0",
            )
            page = context.new_page()
            page.goto(TEST_URL, wait_until="networkidle", timeout=20000)

            title = page.title()
            meta_el = page.query_selector("meta[name='description']")
            meta_desc = meta_el.get_attribute("content") if meta_el else ""

            body_text = page.inner_text("body")[:200]
            h1 = page.inner_text("h1") if page.query_selector("h1") else ""

            style_data = {}
            if page.query_selector("h1"):
                style_data = page.eval_on_selector(
                    "h1",
                    """el => ({
                        font_family: getComputedStyle(el).fontFamily,
                        font_size: getComputedStyle(el).fontSize,
                        font_weight: getComputedStyle(el).fontWeight,
                        color: getComputedStyle(el).color,
                        text_align: getComputedStyle(el).textAlign,
                    })""",
                )

            browser.close()

            return {
                "status": "OK",
                "url": TEST_URL,
                "title": title,
                "h1": h1,
                "meta_description": meta_desc,
                "body_preview": body_text,
                "h1_styles": style_data,
                "viewport": "1920x1080",
                "browser": "chromium",
            }
    except Exception as e:
        return {"status": "FAIL", "error": str(e), "traceback": traceback.format_exc()}


def main():
    print("[Web Handshake] testing Playwright...")
    result = check_playwright()
    result["provider"] = "playwright"
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
