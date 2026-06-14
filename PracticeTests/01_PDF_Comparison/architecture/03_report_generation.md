# SOP 03: Report Generation

## Purpose
Generate three output files from comparison results.

### 1. Excel Report (report.xlsx)
- **Tool:** `openpyxl`
- **Columns:** Line # | Base Text | Compare Text | Status
- **Formatting:**
  - PASS rows: green background
  - FAIL rows: red background
  - Bold header row
  - Auto-column width

### 2. Markdown Summary (report.md)
- Section: Summary stats (total, pass, fail, pass%)
- Table: same columns as Excel
- Located in `output/` folder

### 3. Log File (report.log)
- Timestamped entries for each step:
  - `[TIMESTAMP] Extraction started: <filename>`
  - `[TIMESTAMP] Extracted N lines from <filename>`
  - `[TIMESTAMP] Comparison complete: N total, M pass, K fail`
  - `[TIMESTAMP] Report generated: <filename>`
