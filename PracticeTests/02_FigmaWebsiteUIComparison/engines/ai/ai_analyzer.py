"""AI Analysis Engine — best-effort explanations for comparison failures."""

import json
import os
import sys
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loggers.logger import get_logger

logger = get_logger(__name__)

_PROMPT_TEMPLATE = """You are a UI/UX quality engineer analyzing a visual regression failure.

Element: {element_name} ({element_type})
Tag: {tag}

Figma (expected):
{expected_values}

Website (actual):
{actual_values}

Failed properties:
{failed_properties}

For each failure, provide a brief description, the most likely root cause, and a suggested fix.

Respond in JSON format with this structure:
{{
  "explanations": [
    {{
      "property": "property_name",
      "description": "What went wrong in human terms",
      "root_cause": "Why this likely happened",
      "suggested_fix": "How to fix it",
      "confidence": 0.85
    }}
  ]
}}
"""


class NullProvider:
    """Fallback provider when AI is disabled or unavailable."""

    @staticmethod
    def explain(figma_element: dict, web_element: dict, failed_checks: list[dict]) -> list[dict]:
        return []


class OpenAIProvider:
    """OpenAI API provider for AI analysis."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model

    def explain(self, figma_element: dict, web_element: dict, failed_checks: list[dict]) -> list[dict]:
        try:
            from openai import OpenAI
            prompt = _build_prompt(figma_element, web_element, failed_checks)
            client = OpenAI(api_key=self.api_key, timeout=20)
            resp = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=500,
            )
            raw = resp.choices[0].message.content
            data = json.loads(raw)
            return data.get("explanations", [])
        except Exception as e:
            logger.warning("OpenAI analysis failed: %s", e)
            return []


class OllamaProvider:
    """Ollama local LLM provider for AI analysis."""

    def __init__(self, base_url: str, model: str = "llama3.2"):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def explain(self, figma_element: dict, web_element: dict, failed_checks: list[dict]) -> list[dict]:
        try:
            import requests
            prompt = _build_prompt(figma_element, web_element, failed_checks)
            url = f"{self.base_url}/api/chat"
            payload = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt + "\n\nRespond in JSON format."}],
                "stream": False,
                "format": "json",
            }
            resp = requests.post(url, json=payload, timeout=60)
            if resp.status_code == 200:
                raw = resp.json().get("message", {}).get("content", "{}")
                data = json.loads(raw)
                return data.get("explanations", [])
            else:
                logger.warning("Ollama returned HTTP %d", resp.status_code)
                return []
        except Exception as e:
            logger.warning("Ollama analysis failed: %s", e)
            return []


class AIAnalyzer:
    """Factory for AI analysis — selects provider and returns explanations."""

    @staticmethod
    def analyze(
        figma_element: dict,
        web_element: dict,
        failed_checks: list[dict],
        config: dict = None,
    ) -> list[dict]:
        """Analyze failures using configured AI provider.

        Args:
            figma_element: Figma NormalizedElement dict.
            web_element: Web NormalizedElement dict.
            failed_checks: List of failed ComparisonResult dicts.
            config: Dict with ai.enabled, ai.provider, ai.model,
                   and env vars for keys.

        Returns:
            List of explanation dicts (best-effort, may be empty).
        """
        if config is None:
            config = {}

        ai_config = config.get("ai", {})
        if not ai_config.get("enabled", False):
            return []

        if not failed_checks:
            return []

        provider = ai_config.get("provider", "openai")
        model = ai_config.get("model", "gpt-4o-mini")

        if provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY", "")
            if not api_key:
                logger.info("OPENAI_API_KEY not set — skipping AI analysis")
                return []
            p = OpenAIProvider(api_key, model)
        elif provider == "ollama":
            base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            ollama_model = os.getenv("OLLAMA_MODEL", model)
            p = OllamaProvider(base_url, ollama_model)
        else:
            p = NullProvider()

        return p.explain(figma_element, web_element, failed_checks)


def _build_prompt(figma_element: dict, web_element: dict, failed_checks: list[dict]) -> str:
    """Build the analysis prompt from element data and failed checks."""
    element_name = figma_element.get("name", "Unknown")
    element_type = figma_element.get("type", "unknown")
    tag = figma_element.get("tag", "")

    # Expected values (from Figma)
    f_box = figma_element.get("bounding_box", {}) or {}
    f_typo = figma_element.get("styles", {}).get("typography", {}) or {}
    f_colors = figma_element.get("styles", {}).get("colors", {}) or {}
    expected_lines = [
        f"  Position: ({f_box.get('x', '?')}, {f_box.get('y', '?')})",
        f"  Size: {f_box.get('width', '?')} x {f_box.get('height', '?')}",
        f"  Font: {f_typo.get('font_family', '?')} {f_typo.get('font_size', '?')}px weight={f_typo.get('font_weight', '?')}",
        f"  Color: {f_colors.get('color', '?')}",
        f"  Content: {(figma_element.get('content', '') or '')[:100]}",
    ]

    # Actual values (from Web)
    w_box = web_element.get("bounding_box", {}) or {}
    w_typo = web_element.get("styles", {}).get("typography", {}) or {}
    w_colors = web_element.get("styles", {}).get("colors", {}) or {}
    actual_lines = [
        f"  Position: ({w_box.get('x', '?')}, {w_box.get('y', '?')})",
        f"  Size: {w_box.get('width', '?')} x {w_box.get('height', '?')}",
        f"  Font: {w_typo.get('font_family', '?')} {w_typo.get('font_size', '?')}px weight={w_typo.get('font_weight', '?')}",
        f"  Color: {w_colors.get('color', '?')}",
        f"  Content: {(web_element.get('content', '') or '')[:100]}",
    ]

    # Failed properties
    failed_lines = []
    for check in failed_checks[:10]:
        failed_lines.append(
            f"  - {check.get('property', '?')}: expected={check.get('expected', '?')} "
            f"actual={check.get('actual', '?')} (severity={check.get('severity', '?')})"
        )

    return _PROMPT_TEMPLATE.format(
        element_name=element_name,
        element_type=element_type,
        tag=tag,
        expected_values="\n".join(expected_lines),
        actual_values="\n".join(actual_lines),
        failed_properties="\n".join(failed_lines) if failed_lines else "  (none provided)",
    )
