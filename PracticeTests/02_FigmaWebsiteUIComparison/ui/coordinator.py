"""ComparisonCoordinator — orchestrates the full comparison pipeline."""

import json
import os
import sys
import threading
import traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loggers.logger import get_logger
from session.manager import SessionManager
from storage.manager import StorageManager
from engines.extraction.figma_engine import FigmaExtractor
from engines.extraction.web_engine import WebExtractor
from engines.matcher.element_matcher import ElementMatcher
from engines.comparison.style_comparator import StyleComparator
from engines.comparison.color_comparator import ColorComparator
from engines.comparison.layout_comparator import LayoutComparator
from engines.comparison.component_comparator import ComponentComparator
from engines.comparison.image_comparator import ImageComparator
from engines.comparison.accessibility_comparator import AccessibilityComparator
from engines.comparison.responsive_comparator import ResponsiveComparator
from engines.ai.ai_analyzer import AIAnalyzer
from engines.reporter.json_reporter import JSONReporter
from engines.reporter.excel_reporter import ExcelReporter
from engines.reporter.html_reporter import HTMLReporter

logger = get_logger(__name__)


class ComparisonCoordinator:
    """Orchestrates the full comparison pipeline: extract → match → compare → analyze → report."""

    @staticmethod
    def start(session_id: str, config: dict) -> None:
        """Start the comparison pipeline in a background thread.

        Args:
            session_id: UUID for this comparison run.
            config: Configuration dict with figma_url, web_url, categories, etc.
        """
        thread = threading.Thread(
            target=ComparisonCoordinator._run,
            args=(session_id, config),
            daemon=True,
        )
        thread.start()
        logger.info("Coordinator started for session %s", session_id)

    @staticmethod
    def _run(session_id: str, config: dict) -> None:
        """Execute the full pipeline synchronously (runs in background thread)."""
        session_dir = f".tmp/sessions/{session_id}"
        output_dir = f"output/{session_id}"

        try:
            # Step 1: Extract Figma elements
            ComparisonCoordinator._transition(session_id, "extracting")
            figma_url = config.get("figma_url", "")
            figma_token = config.get("figma_token", "")
            figma_elements = FigmaExtractor.extract(figma_url, figma_token)
            SessionManager.save_intermediate(session_id, "figma_elements", figma_elements)
            logger.info("Extracted %d Figma elements", len(figma_elements))

            # Step 2: Extract Web elements
            web_url = config.get("web_url", "")
            viewport_configs = config.get("viewports", [
                {"name": "Desktop", "width": 1920, "height": 1080},
            ])
            web_results = WebExtractor.extract(web_url, viewport_configs)
            SessionManager.save_intermediate(session_id, "web_elements", web_results)
            web_elements = []
            for vp_name, vp_data in web_results.items():
                if vp_data.get("status") == "OK":
                    web_elements.extend(vp_data.get("elements", []))
            logger.info("Extracted %d web elements", len(web_elements))

            if not web_elements:
                raise ValueError("No web elements extracted — cannot proceed")

            # Step 3: Match elements
            ComparisonCoordinator._transition(session_id, "matching")
            tolerance = config.get("tolerance", {}) or {}
            match_result = ElementMatcher.match(
                figma_elements, web_elements,
                position_tolerance=tolerance.get("position", 2),
                size_tolerance=tolerance.get("size", 2),
            )
            SessionManager.save_intermediate(session_id, "matched_pairs", match_result)
            logger.info("Matched %d pairs", len(match_result.get("matches", [])))

            # Step 4: Compare elements
            ComparisonCoordinator._transition(session_id, "comparing")
            enabled_categories = config.get("categories", [
                "typography", "colors", "layout", "components", "accessibility", "images", "responsive"
            ])
            category_map = {c: True for c in enabled_categories}
            all_results = {}

            for match in match_result.get("matches", []):
                figma = match.get("figma_element", {})
                web = match.get("web_element", {})
                elem_id = match.get("figma_id", "")
                checks = []

                if category_map.get("typography"):
                    checks.extend(StyleComparator.compare(figma, web, tolerance))
                if category_map.get("colors"):
                    checks.extend(ColorComparator.compare(figma, web, tolerance))
                if category_map.get("layout"):
                    checks.extend(LayoutComparator.compare(figma, web, tolerance))
                if category_map.get("components"):
                    checks.extend(ComponentComparator.compare(figma, web, tolerance))
                if category_map.get("accessibility"):
                    checks.extend(AccessibilityComparator.compare(figma, web, tolerance))
                if category_map.get("images"):
                    checks.extend(ImageComparator.compare(figma, web, tolerance=tolerance))
                if category_map.get("responsive"):
                    checks.extend(ResponsiveComparator.compare(
                        figma, web, tolerance, viewport_configs, web_results
                    ))

                all_results[elem_id] = checks

            SessionManager.save_intermediate(session_id, "comparison_results", all_results)
            total_checks = sum(len(c) for c in all_results.values())
            logger.info("Completed %d comparison checks", total_checks)

            # Step 5: AI Analysis (if enabled)
            if config.get("ai_enabled", False):
                ComparisonCoordinator._transition(session_id, "analyzing")
                ai_config = config.get("ai", {"enabled": True, "provider": "openai"})
                ai_analysis = {}

                for match in match_result.get("matches", []):
                    figma = match.get("figma_element", {})
                    web = match.get("web_element", {})
                    elem_id = match.get("figma_id", "")
                    failed_checks = [c for c in all_results.get(elem_id, []) if c.get("status") == "FAIL"]

                    if failed_checks:
                        explanations = AIAnalyzer.analyze(figma, web, failed_checks, {"ai": ai_config})
                        if explanations:
                            ai_analysis[elem_id] = explanations

                if ai_analysis:
                    SessionManager.save_intermediate(session_id, "ai_analysis", ai_analysis)
                    logger.info("AI analysis complete for %d elements", len(ai_analysis))

            # Step 6: Generate summary
            ComparisonCoordinator._transition(session_id, "reporting")
            summary = ComparisonCoordinator._compute_summary(
                match_result, all_results, figma_elements, web_elements
            )
            session = SessionManager.get(session_id)
            if session:
                session["summary"] = summary

            # Step 7: Generate reports
            elements_data = []
            for match in match_result.get("matches", []):
                elem_id = match.get("figma_id", "")
                elements_data.append({
                    "figma_element": match.get("figma_element"),
                    "web_element": match.get("web_element"),
                    "checks": all_results.get(elem_id, []),
                    "figma_id": elem_id,
                })

            os.makedirs(output_dir, exist_ok=True)
            JSONReporter.generate({"id": session_id, "summary": summary, "config": config, "status": "complete"}, session_dir, output_dir)
            ExcelReporter.generate({"id": session_id, "summary": summary, "config": config, "status": "complete"}, session_dir, output_dir, elements_data)
            HTMLReporter.generate({"id": session_id, "summary": summary, "config": config, "status": "complete", "created_at": session.get("created_at", "") if session else ""}, session_dir, output_dir, elements_data)

            # Mark complete
            SessionManager.update_status(session_id, "complete")

            # Re-apply summary and finalize (update_status reloads from disk)
            final_session = SessionManager.get(session_id)
            if final_session:
                final_session["summary"] = summary
                from storage.manager import StorageManager
                StorageManager.save_json(
                    f".tmp/sessions/{session_id}/session.json", final_session
                )

            SessionManager.save_to_history(session_id)
            logger.info("Session %s complete", session_id)

        except Exception as e:
            logger.error("Pipeline failed: %s", traceback.format_exc())
            try:
                SessionManager.update_status(session_id, "failed", error=str(e))
            except Exception:
                pass

    @staticmethod
    def _transition(session_id: str, status: str) -> None:
        """Update session status, ignoring invalid transition errors."""
        try:
            SessionManager.update_status(session_id, status)
        except ValueError as e:
            logger.warning("Status transition issue: %s", e)

    @staticmethod
    def _compute_summary(
        match_result: dict,
        all_results: dict,
        figma_elements: list,
        web_elements: list,
    ) -> dict:
        """Compute summary statistics from all comparison results."""
        matches = match_result.get("matches", [])
        total_checks = 0
        pass_count = 0
        fail_count = 0
        by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        by_category = {}

        for elem_id, checks in all_results.items():
            for check in checks:
                total_checks += 1
                if check.get("status") == "PASS":
                    pass_count += 1
                else:
                    fail_count += 1
                    sev = check.get("severity", "low")
                    if sev in by_severity:
                        by_severity[sev] += 1

                cat = check.get("category", "unknown")
                if cat not in by_category:
                    by_category[cat] = {"pass": 0, "fail": 0}
                if check.get("status") == "PASS":
                    by_category[cat]["pass"] += 1
                else:
                    by_category[cat]["fail"] += 1

        for cat, data in by_category.items():
            total = data["pass"] + data["fail"]
            data["pass_pct"] = round(data["pass"] / total * 100, 1) if total > 0 else 100.0

        overall = round(pass_count / total_checks * 100, 1) if total_checks > 0 else 100.0
        verdict = "PASS" if overall >= 90 else ("WARN" if overall >= 80 else "FAIL")

        return {
            "overall_similarity": overall,
            "total_elements": len(matches),
            "total_checks": total_checks,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "pass_percentage": overall,
            "by_severity": by_severity,
            "by_category": by_category,
            "verdict": f"{verdict} — {fail_count} issues found, {by_severity['critical']} critical",
        }
