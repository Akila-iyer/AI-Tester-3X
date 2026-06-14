"""API Routes — REST endpoints for the Visual UI Testing Platform."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from flask import Blueprint, jsonify, request, send_file

from loggers.logger import get_logger
from session.manager import SessionManager
from ui.coordinator import ComparisonCoordinator
from config.schema import load_config

logger = get_logger(__name__)

api_bp = Blueprint("api", __name__, url_prefix="/api")


def _get_session_or_404(session_id: str):
    """Get session or return 404 response."""
    session = SessionManager.get(session_id)
    if session is None:
        return None
    return session


# ---- Comparisons ----

@api_bp.route("/comparisons", methods=["POST"])
def start_comparison():
    """Start a new visual comparison."""
    data = request.get_json(silent=True) or {}
    figma_url = data.get("figma_url", "")
    web_url = data.get("web_url", "")

    if not web_url:
        return jsonify({"error": "web_url is required"}), 400

    config = {
        "figma_url": figma_url,
        "web_url": web_url,
        "figma_token": data.get("figma_token", ""),
        "viewports": data.get("viewports", [
            {"name": "Desktop", "width": 1920, "height": 1080},
        ]),
        "categories": data.get("categories", [
            "typography", "colors", "layout", "components", "accessibility", "images"
        ]),
        "ai_enabled": data.get("ai_enabled", False),
        "ai": data.get("ai", {"provider": "openai"}),
        "tolerance": data.get("tolerance", {}),
    }

    session = SessionManager.create(config)
    session_id = session["id"]

    # Start pipeline in background
    ComparisonCoordinator.start(session_id, config)

    return jsonify({
        "session_id": session_id,
        "status": "pending",
        "status_url": f"/api/comparisons/{session_id}/status",
    }), 202


@api_bp.route("/comparisons/<session_id>/status", methods=["GET"])
def get_status(session_id: str):
    """Get current status of a comparison run."""
    session = _get_session_or_404(session_id)
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    config = session.get("config", {}) or {}
    viewports = config.get("viewports", [{"name": "Desktop", "width": 1920, "height": 1080}])

    # Determine stage progress
    status_order = ["pending", "extracting", "matching", "comparing", "analyzing", "reporting", "complete", "failed"]
    current_status = session.get("status", "pending")
    stage_idx = status_order.index(current_status) if current_status in status_order else 0
    stage_progress = stage_idx / (len(status_order) - 2)  # Exclude failed

    return jsonify({
        "session_id": session_id,
        "status": current_status,
        "progress": {
            "current_stage": current_status.capitalize(),
            "stage_progress": min(stage_progress, 1.0),
            "total_stages": len(status_order) - 2,
            "current_stage_index": stage_idx,
        },
        "error": session.get("error"),
    })


@api_bp.route("/comparisons/<session_id>/results", methods=["GET"])
def get_results(session_id: str):
    """Get full comparison results."""
    session = _get_session_or_404(session_id)
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    session_dir = f".tmp/sessions/{session_id}"
    matches_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        session_dir,
        "matched_pairs.json",
    )
    results_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        session_dir,
        "comparison_results.json",
    )

    matches = []
    if os.path.exists(matches_file):
        with open(matches_file, "r", encoding="utf-8") as f:
            matches_data = json.load(f)
            matches = matches_data.get("matches", [])

    all_results = {}
    if os.path.exists(results_file):
        with open(results_file, "r", encoding="utf-8") as f:
            all_results = json.load(f)

    # Build element list with checks
    elements = []
    for m in matches:
        elem_id = m.get("figma_id", "")
        elements.append({
            "figma_id": elem_id,
            "figma_element": m.get("figma_element"),
            "web_element": m.get("web_element"),
            "confidence": m.get("confidence", 0),
            "checks": all_results.get(elem_id, []),
        })

    # Load AI analysis
    ai_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        session_dir,
        "ai_analysis.json",
    )
    ai_analysis = []
    if os.path.exists(ai_file):
        with open(ai_file, "r", encoding="utf-8") as f:
            ai_analysis = json.load(f)

    return jsonify({
        "session_id": session_id,
        "status": session.get("status", ""),
        "summary": session.get("summary", {}),
        "elements": elements,
        "ai_analysis": ai_analysis,
    })


@api_bp.route("/comparisons/<session_id>/elements/<element_id>", methods=["GET"])
def get_element_detail(session_id: str, element_id: str):
    """Get detailed view for a single element."""
    session = _get_session_or_404(session_id)
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    session_dir = f".tmp/sessions/{session_id}"
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    matches_file = os.path.join(base_path, session_dir, "matched_pairs.json")
    results_file = os.path.join(base_path, session_dir, "comparison_results.json")
    ai_file = os.path.join(base_path, session_dir, "ai_analysis.json")

    matches = []
    if os.path.exists(matches_file):
        with open(matches_file, "r", encoding="utf-8") as f:
            matches_data = json.load(f)
            matches = matches_data.get("matches", [])

    all_results = {}
    if os.path.exists(results_file):
        with open(results_file, "r", encoding="utf-8") as f:
            all_results = json.load(f)

    ai_analysis = {}
    if os.path.exists(ai_file):
        with open(ai_file, "r", encoding="utf-8") as f:
            ai_analysis = json.load(f)

    # Find matching element
    for m in matches:
        if m.get("figma_id") == element_id or m.get("web_selector") == element_id:
            return jsonify({
                "element_id": element_id,
                "figma": m.get("figma_element"),
                "web": m.get("web_element"),
                "confidence": m.get("confidence", 0),
                "checks": all_results.get(m.get("figma_id", ""), []),
                "ai_explanation": ai_analysis.get(m.get("figma_id", ""), []),
            })

    return jsonify({"error": "Element not found"}), 404


@api_bp.route("/comparisons/<session_id>/screenshots", methods=["GET"])
def get_screenshots(session_id: str):
    """Get screenshot URLs for a session."""
    session = _get_session_or_404(session_id)
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    screenshots_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        ".tmp", "screenshots",
    )

    screenshots = {}
    if os.path.isdir(screenshots_dir):
        for fname in os.listdir(screenshots_dir):
            if fname.endswith(".png"):
                screenshots[fname.replace(".png", "")] = f"/screenshots/{fname}"

    return jsonify(screenshots)


@api_bp.route("/comparisons/<session_id>/report/<fmt>", methods=["GET"])
def download_report(session_id: str, fmt: str):
    """Download a generated report file."""
    session = _get_session_or_404(session_id)
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    output_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "output", session_id,
    )

    mime_map = {
        "json": "application/json",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "html": "text/html",
    }
    ext_map = {"json": "json", "excel": "xlsx", "html": "html"}
    filenames = {"json": "report.json", "excel": "report.xlsx", "html": "report.html"}

    if fmt not in filenames:
        return jsonify({"error": f"Unsupported format: {fmt}. Supported: json, excel, html"}), 400

    filepath = os.path.join(output_dir, filenames[fmt])
    if not os.path.exists(filepath):
        return jsonify({"error": f"Report not yet generated (status: {session.get('status', '')})"}), 404

    return send_file(
        filepath,
        mimetype=mime_map.get(fmt, "application/octet-stream"),
        as_attachment=True,
        download_name=f"visual_ui_report_{session_id[:8]}.{ext_map.get(fmt, 'json')}",
    )


# ---- History ----

@api_bp.route("/history", methods=["GET"])
def get_history():
    """List recent comparison sessions."""
    limit = request.args.get("limit", 25, type=int)
    offset = request.args.get("offset", 0, type=int)
    sessions = SessionManager.list_sessions(limit, offset)
    return jsonify({"runs": sessions, "total": len(sessions)})


# ---- Screenshot serving ----

@api_bp.route("/screenshots/<filename>", methods=["GET"])
def serve_screenshot(filename: str):
    """Serve screenshot images."""
    screenshots_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        ".tmp", "screenshots",
    )
    filepath = os.path.join(screenshots_dir, filename)
    if os.path.exists(filepath):
        return send_file(filepath, mimetype="image/png")
    return jsonify({"error": "File not found"}), 404
