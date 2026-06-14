"""Flask web app for file comparison."""

import os
import uuid
from flask import Flask, render_template, request, jsonify, send_file

from tools.extractor import extract
from tools.comparator import compare, summarize
from tools.reporter import generate_all

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, ".tmp", "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app.config["UPLOAD_DIR"] = UPLOAD_DIR
app.config["OUTPUT_DIR"] = OUTPUT_DIR
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/compare", methods=["POST"])
def compare_files():
    if "base_file" not in request.files or "compare_file" not in request.files:
        return jsonify({"error": "Both base_file and compare_file are required"}), 400

    base = request.files["base_file"]
    comp = request.files["compare_file"]

    if base.filename == "" or comp.filename == "":
        return jsonify({"error": "Both files must be selected"}), 400

    # Save uploads with unique names
    suffix = uuid.uuid4().hex[:8]
    base_path = os.path.join(UPLOAD_DIR, f"base_{suffix}_{base.filename}")
    comp_path = os.path.join(UPLOAD_DIR, f"comp_{suffix}_{comp.filename}")
    base.save(base_path)
    comp.save(comp_path)

    try:
        # Extract
        base_lines, _ = extract(base_path)
        comp_lines, _ = extract(comp_path)

        # Compare
        results = compare(base_lines, comp_lines)
        summary = summarize(results)

        # Generate reports
        report_id = uuid.uuid4().hex[:8]
        output_dir = os.path.join(OUTPUT_DIR, report_id)
        os.makedirs(output_dir, exist_ok=True)

        report_paths = generate_all(
            results, summary, base.filename, comp.filename, output_dir
        )

        return jsonify({
            "success": True,
            "summary": summary,
            "report_id": report_id,
            "downloads": {
                "excel": f"/download/{report_id}/report.xlsx",
                "markdown": f"/download/{report_id}/report.md",
                "log": f"/download/{report_id}/report.log",
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Cleanup uploaded files
        try:
            os.remove(base_path)
            os.remove(comp_path)
        except OSError:
            pass


@app.route("/download/<report_id>/<filename>")
def download(report_id, filename):
    filepath = os.path.join(OUTPUT_DIR, report_id, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404
    return send_file(filepath, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
