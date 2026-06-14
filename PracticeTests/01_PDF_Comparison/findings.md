# Findings — File Comparison Agent

## Initial Notes
- Project started: 2026-06-14
- Following B.L.A.S.T framework (Blueprint, Link, Architect, Stylize, Trigger)
- Folder: `01_PDF_Comparison`

## Technical Decisions
- **PDF:** pdfplumber — best text extraction accuracy for non-scanned PDFs
- **Word:** python-docx — extracts paragraphs and table cells
- **Excel:** openpyxl — reads all sheets as flat cell-by-cell text
- **CSV:** built-in csv module — simple and reliable
- **UI:** Flask single-page app — lightweight, no db needed
- **Output formats:** Excel (colored rows), Markdown (summary + table), Log (timestamped trace)

## File Types Supported
- PDF (.pdf) — text content only
- Word (.docx) — paragraphs + tables
- Excel (.xlsx, .xls) — all sheets flattened
- CSV (.csv) — UTF-8 with latin-1 fallback
