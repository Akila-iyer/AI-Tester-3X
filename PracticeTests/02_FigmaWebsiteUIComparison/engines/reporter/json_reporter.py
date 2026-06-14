"""JSON Reporter — exports full session data to JSON."""

import os
import sys
import json
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loggers.logger import get_logger
from storage.manager import StorageManager

logger = get_logger(__name__)


class JSONReporter:
    """Exports comparison results to JSON."""

    @staticmethod
    def generate(session: dict, session_dir: str, output_dir: str) -> str:
        """Generate JSON report.

        Args:
            session: Session dict with summary and config.
            session_dir: Path to session data directory (.tmp/sessions/{id}/).
            output_dir: Output directory (output/{id}/).

        Returns:
            Path to generated JSON file.
        """
        report = {
            "session": {
                "id": session.get("id", ""),
                "status": session.get("status", ""),
                "created_at": session.get("created_at", ""),
                "completed_at": session.get("completed_at", ""),
                "config": session.get("config", {}),
            },
            "summary": session.get("summary", {}),
            "elements": JSONReporter._load_elements(session_dir),
            "ai_analysis": StorageManager.load_json(
                f"output/{os.path.basename(output_dir)}/ai_analysis.json"
            ) or [],
        }

        os.makedirs(output_dir, exist_ok=True)
        path = os.path.join(output_dir, "report.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, default=str)

        logger.info("JSON report saved: %s", path)
        return path

    @staticmethod
    def _load_elements(session_dir: str) -> list:
        """Load matched pairs and comparison results from session data."""
        matches_file = os.path.join(session_dir, "matched_pairs.json")
        results_file = os.path.join(session_dir, "comparison_results.json")

        matches = []
        if os.path.exists(matches_file):
            with open(matches_file, "r", encoding="utf-8") as f:
                matches_data = json.load(f)
                matches = matches_data.get("matches", [])

        results = {}
        if os.path.exists(results_file):
            with open(results_file, "r", encoding="utf-8") as f:
                results = json.load(f)

        elements = []
        for m in matches:
            elem_id = m.get("figma_id", "")
            elements.append({
                "figma_id": elem_id,
                "figma_element": m.get("figma_element"),
                "web_element": m.get("web_element"),
                "confidence": m.get("confidence", 0),
                "checks": results.get(elem_id, []),
            })

        return elements
