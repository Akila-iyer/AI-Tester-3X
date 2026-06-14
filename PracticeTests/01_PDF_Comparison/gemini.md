# Project Constitution — File Comparison Agent

## Project Map
- **Identity:** File Comparison Agent
- **Purpose:** Compare two files (PDF, Word, Excel), identify all differences per line, generate structured report
- **Built with:** B.L.A.S.T. protocol + A.N.T. 3-layer architecture
- **Output:** Excel (Pass/Fail per row) + Markdown summary + Log file

## Data Schema

### Input
```json
{
  "base_file": "uploaded_file (pdf|docx|xlsx|csv)",
  "compare_file": "uploaded_file (pdf|docx|xlsx|csv)",
  "file_type": "pdf | docx | xlsx | csv"
}
```

### Extracted Content (Intermediate)
```json
{
  "base_content": ["line1", "line2", ...],
  "compare_content": ["line1", "line2", ...],
  "meta": {
    "base_filename": "string",
    "compare_filename": "string",
    "file_type": "string",
    "extraction_time": "ISO timestamp"
  }
}
```

### Output Report
```json
{
  "results": [
    {
      "line_number": 1,
      "base_text": "string",
      "compare_text": "string",
      "status": "PASS | FAIL"
    }
  ],
  "summary": {
    "total_lines": 0,
    "pass_count": 0,
    "fail_count": 0,
    "pass_percentage": 0.0
  }
}
```

### Deliverables
| File | Format | Content |
|------|--------|---------|
| `report.xlsx` | Excel | Each row = line, columns: Line#, Base, Compare, Status |
| `report.md` | Markdown | Summary stats + diff table |
| `report.log` | Log file | Timestamped trace of every extraction & comparison step |

## Behavioral Rules
- Compare ALL content — no skips, no ignores
- Line-by-line exact comparison (case-sensitive)
- Empty lines are preserved and compared
- All intermediate files in `.tmp/`
- Deterministic: same input = same output

## Architecture Invariants
- Input: Two uploaded files via web UI
- Output: Excel + Markdown + Log downloadable from UI
- Tools: Python scripts in `tools/`
- SOPs: Markdown in `architecture/`
- UI: Flask web app served on `localhost`

---

*Last updated: 2026-06-14*
