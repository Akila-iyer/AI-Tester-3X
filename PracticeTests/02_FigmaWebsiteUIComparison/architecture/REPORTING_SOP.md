# Reporting SOP

## Output Formats (Phase 3)

Three reporters are built in Phase 3. Additional formats can be added later.

## 1. JSONReporter

### Output
- File: `output/{session_id}/report.json`
- Complete data dump of the entire session
- Used as the source for all other reporters

### Structure
```json
{
  "session": { ... },
  "summary": {
    "overall_similarity": 87.3,
    "total_elements": 142,
    "total_checks": 1136,
    "pass_count": 992,
    "fail_count": 144,
    "by_severity": { "critical": 2, "high": 18, "medium": 45, "low": 79 },
    "by_category": { "typography": { "pass": 230, "fail": 42 }, ... },
    "verdict": "FAIL — 144 issues found, 2 critical"
  },
  "elements": [
    {
      "figma_element": { ... },
      "web_element": { ... },
      "confidence": 0.94,
      "checks": [ ... ]
    }
  ],
  "ai_analysis": [ ... ]
}
```

## 2. ExcelReporter

### Output
- File: `output/{session_id}/report.xlsx`
- 3 sheets using openpyxl:

**Sheet 1: Summary**
- Session info (ID, URLs, date, duration)
- Pass/fail counts and percentages
- Severity breakdown
- Category breakdown
- Overall verdict

**Sheet 2: All Checks**
- Flat table: Row per check
- Columns: Element, Category, Property, Expected, Actual, Unit, Status, Severity, Tolerance, Difference
- Color-coded: green for PASS, red for FAIL (openpyxl PatternFill)

**Sheet 3: AI Analysis** (if AI enabled)
- Columns: Element, Property, Description, Root Cause, Suggested Fix, AI Confidence

## 3. HTMLReporter

### Output
- File: `output/{session_id}/report.html`
- Self-contained HTML (CSS inlined, no external dependencies)
- Embedded screenshot diffs as base64

### Sections
1. **Header** — Project name, session ID, date, verdict badge
2. **Summary Cards** — Overall similarity %, pass/fail counts, severity breakdown
3. **Category Bars** — Horizontal bar chart showing pass % per category
4. **Issue Table** — Sortable/filterable table of all FAIL checks
5. **Element Details** — Per-element expansion with all checks and AI explanations

### Template
- Uses Jinja2
- Template stored at `engines/reporter/templates/report.html`
- CSS inlined for portability
- No Chart.js — uses simple CSS bars for category chart
