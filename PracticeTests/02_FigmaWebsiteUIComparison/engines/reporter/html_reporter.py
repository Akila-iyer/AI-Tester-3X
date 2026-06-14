"""HTML Reporter — generates self-contained HTML dashboard."""

import base64
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from loggers.logger import get_logger

logger = get_logger(__name__)


class HTMLReporter:
    """Generates a self-contained HTML report from comparison results."""

    @staticmethod
    def generate(session: dict, session_dir: str, output_dir: str, elements: list = None) -> str:
        """Generate HTML report.

        Args:
            session: Session dict.
            session_dir: Path to session data.
            output_dir: Output directory.
            elements: Pre-loaded element list with checks.

        Returns:
            Path to generated .html file.
        """
        summary = session.get("summary", {}) or {}
        config = session.get("config", {}) or {}

        # Build severity breakdown
        by_severity = summary.get("by_severity", {}) or {}
        sev_bar = HTMLReporter._severity_bar(by_severity)

        # Build category bars
        by_category = summary.get("by_category", {}) or {}
        cat_bars = HTMLReporter._category_bars(by_category)

        # Build issue table
        issue_rows = HTMLReporter._issue_rows(elements)

        # Build element details
        elem_details = HTMLReporter._element_details(elements)

        # Try to embed screenshot diff
        screenshot_img = ""
        diff_path = os.path.join(output_dir, "..", "..", ".tmp", "screenshots", "diff_overlay.png")
        if os.path.exists(diff_path):
            with open(diff_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
                screenshot_img = f'<div class="section"><h3>Screenshot Diff</h3><img src="data:image/png;base64,{b64}" style="max-width:100%;border:1px solid #ddd;border-radius:8px;" /></div>'

        verdict = summary.get("verdict", "Unknown")
        verdict_class = "verdict-pass" if summary.get("pass_percentage", 100) >= 90 else ("verdict-warn" if summary.get("pass_percentage", 100) >= 80 else "verdict-fail")

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Visual UI Testing Report — {session.get('id', '')[:8]}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; color: #1a1a2e; padding: 20px; }}
.container {{ max-width: 1200px; margin: 0 auto; }}
.header {{ background: #1a1a2e; color: #fff; padding: 24px 32px; border-radius: 12px; margin-bottom: 24px; }}
.header h1 {{ font-size: 24px; margin-bottom: 4px; }}
.header .meta {{ color: #9ca3af; font-size: 14px; }}
.verdict {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-top: 8px; }}
.verdict-pass {{ background: #d1fae5; color: #065f46; }}
.verdict-warn {{ background: #fef3c7; color: #92400e; }}
.verdict-fail {{ background: #fee2e2; color: #991b1b; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }}
.card {{ background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
.card .label {{ font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }}
.card .value {{ font-size: 32px; font-weight: 700; margin-top: 4px; }}
.section {{ background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; }}
.section h3 {{ font-size: 16px; color: #374151; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }}
.bar-container {{ margin-bottom: 12px; }}
.bar-label {{ font-size: 14px; margin-bottom: 4px; color: #374151; }}
.bar {{ height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }}
.bar-fill {{ height: 100%; border-radius: 10px; transition: width 0.3s; }}
.bar-text {{ font-size: 12px; color: #6b7280; margin-top: 2px; }}
table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
th {{ text-align: left; padding: 10px 12px; background: #f3f4f6; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb; }}
td {{ padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }}
tr:hover {{ background: #f9fafb; }}
.status-badge {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }}
.status-pass {{ background: #d1fae5; color: #065f46; }}
.status-fail {{ background: #fee2e2; color: #991b1b; }}
.severity-critical {{ background: #7f1d1d; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 12px; }}
.severity-high {{ background: #dc2626; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 12px; }}
.severity-medium {{ background: #f59e0b; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 12px; }}
.severity-low {{ background: #9ca3af; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 12px; }}
.element-detail {{ margin-bottom: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }}
.element-detail h4 {{ font-size: 14px; font-weight: 600; margin-bottom: 8px; }}
.element-detail .prop-table {{ font-size: 13px; }}
.prop-table td:first-child {{ font-weight: 500; color: #6b7280; width: 160px; }}
.filter-bar {{ margin-bottom: 16px; }}
.filter-bar select {{ padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }}
@media (max-width: 768px) {{ .grid {{ grid-template-columns: 1fr; }} }}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>Visual UI Testing Report</h1>
        <div class="meta">
            Session: {session.get('id', '')[:8]} |
            {session.get('created_at', '')[:10]} |
            <a href="{config.get('figma_url', '#')}" style="color:#93c5fd;">Figma</a> vs
            <a href="{config.get('web_url', '#')}" style="color:#93c5fd;">Website</a>
        </div>
        <div class="verdict {verdict_class}">{verdict}</div>
    </div>

    <div class="grid">
        <div class="card">
            <div class="label">Similarity</div>
            <div class="value">{summary.get('overall_similarity', 0)}%</div>
        </div>
        <div class="card">
            <div class="label">Total Checks</div>
            <div class="value">{summary.get('total_checks', 0)}</div>
        </div>
        <div class="card">
            <div class="label">Passed</div>
            <div class="value" style="color:#059669;">{summary.get('pass_count', 0)}</div>
        </div>
        <div class="card">
            <div class="label">Failed</div>
            <div class="value" style="color:#dc2626;">{summary.get('fail_count', 0)}</div>
        </div>
    </div>

    <div class="grid">
        <div class="section">
            <h3>Severity Breakdown</h3>
            {sev_bar}
        </div>
        <div class="section">
            <h3>Category Breakdown</h3>
            {cat_bars}
        </div>
    </div>

    {screenshot_img}

    <div class="section">
        <h3>Issues</h3>
        <div class="filter-bar">
            <select id="sevFilter" onchange="filterTable()">
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>
        </div>
        <table id="issueTable">
            <thead>
                <tr><th>Element</th><th>Property</th><th>Expected</th><th>Actual</th><th>Status</th><th>Severity</th></tr>
            </thead>
            <tbody>
                {issue_rows}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>Element Details</h3>
        {elem_details}
    </div>
</div>
<script>
function filterTable() {{
    var filter = document.getElementById('sevFilter').value;
    var rows = document.querySelectorAll('#issueTable tbody tr');
    rows.forEach(function(row) {{
        var sev = row.getAttribute('data-severity') || '';
        if (filter === 'all' || sev === filter) row.style.display = '';
        else row.style.display = 'none';
    }});
}}
</script>
</body>
</html>"""

        path = os.path.join(output_dir, "report.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        logger.info("HTML report saved: %s", path)
        return path

    @staticmethod
    def _severity_bar(by_severity: dict) -> str:
        colors = {"critical": "#7f1d1d", "high": "#dc2626", "medium": "#f59e0b", "low": "#9ca3af"}
        total = sum(by_severity.values()) or 1
        parts = []
        for sev in ["critical", "high", "medium", "low"]:
            count = by_severity.get(sev, 0)
            if count > 0:
                pct = count / total * 100
                color = colors.get(sev, "#9ca3af")
                parts.append(f'<div style="display:flex;align-items:center;margin-bottom:8px;"><div style="width:80px;font-size:14px;color:#374151;">{sev.capitalize()}</div><div class="bar" style="flex:1;"><div class="bar-fill" style="width:{pct}%;background:{color};"></div></div><div class="bar-text" style="margin-left:8px;">{count}</div></div>')
        return "".join(parts)

    @staticmethod
    def _category_bars(by_category: dict) -> str:
        colors = {"typography": "#3b82f6", "colors": "#8b5cf6", "layout": "#10b981", "components": "#f59e0b", "images": "#ef4444", "accessibility": "#06b6d4", "responsive": "#ec4899"}
        parts = []
        for cat, data in (by_category or {}).items():
            pct = data.get("pass_pct", 0) if data else 0
            color = colors.get(cat, "#6b7280")
            parts.append(f'<div class="bar-container"><div class="bar-label">{cat.capitalize()} <span style="float:right;color:#6b7280;">{pct:.1f}%</span></div><div class="bar"><div class="bar-fill" style="width:{pct}%;background:{color};"></div></div></div>')
        return "".join(parts)

    @staticmethod
    def _issue_rows(elements: list) -> str:
        rows = []
        if elements:
            for elem in elements:
                elem_name = elem.get("figma_element", {}).get("name", "Unknown") if elem.get("figma_element") else "Unknown"
                checks = elem.get("checks", [])
                for check in checks:
                    if check.get("status") != "FAIL":
                        continue
                    sev = check.get("severity", "low")
                    rows.append(f'<tr data-severity="{sev}"><td>{elem_name}</td><td>{check.get("property", "")}</td><td>{str(check.get("expected", ""))[:30]}</td><td>{str(check.get("actual", ""))[:30]}</td><td><span class="status-badge status-fail">FAIL</span></td><td><span class="severity-{sev}">{sev}</span></td></tr>')
        if not rows:
            rows.append('<tr><td colspan="6" style="text-align:center;color:#6b7280;">No failures found</td></tr>')
        return "\n".join(rows)

    @staticmethod
    def _element_details(elements: list) -> str:
        parts = []
        if elements:
            for elem in elements[:20]:  # Max 20 details
                figma = elem.get("figma_element", {}) or {}
                name = figma.get("name", "Unknown")
                tag = figma.get("tag", "")
                checks = elem.get("checks", [])
                checks_html = ""
                for c in checks:
                    status_class = "status-pass" if c.get("status") == "PASS" else "status-fail"
                    checks_html += f'<tr><td>{c.get("property", "")}</td><td>{str(c.get("expected", ""))[:25]}</td><td>{str(c.get("actual", ""))[:25]}</td><td><span class="status-badge {status_class}">{c.get("status", "")}</span></td><td>{c.get("severity", "")}</td></tr>'

                parts.append(f'<div class="element-detail"><h4>{name} <span style="color:#6b7280;font-weight:400;">({tag})</span></h4><table class="prop-table"><thead><tr><th>Property</th><th>Expected</th><th>Actual</th><th>Status</th><th>Severity</th></tr></thead><tbody>{checks_html}</tbody></table></div>')
        if not parts:
            parts.append('<p style="color:#6b7280;">No element data available.</p>')
        return "\n".join(parts)
