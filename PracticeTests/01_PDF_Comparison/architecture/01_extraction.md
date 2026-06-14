# SOP 01: File Content Extraction

## Purpose
Extract all textual content from uploaded files (PDF, DOCX, XLSX, CSV) into a flat list of strings (one per line/cell).

## Supported Formats

### PDF (.pdf)
- **Tool:** `pdfplumber`
- **Method:** Extract text per page, split by newlines into lines
- **Edge Cases:**
  - Scanned PDFs (image-only) — extracted text will be empty; user is warned
  - Tables in PDF — extracted as raw text, row by row
  - Empty pages — skipped silently

### Word (.docx)
- **Tool:** `python-docx`
- **Method:** Extract all paragraphs, then all table cells as individual lines
- **Edge Cases:**
  - Headers/footers — included
  - Embedded objects — skipped (only text extracted)
  - Empty paragraphs — preserved as empty lines

### Excel (.xlsx, .xls)
- **Tool:** `openpyxl`
- **Method:** Iterate all rows in all sheets, each cell becomes a line
- **Edge Cases:**
  - Merged cells — only the top-left value is read
  - Empty cells — preserved as empty lines
  - Multiple sheets — flattened in sheet order with "[Sheet: Name]" header lines

### CSV (.csv)
- **Tool:** Python `csv` module
- **Method:** Each row's cells joined with " | " as separator
- **Edge Cases:**
  - Encoding issues — fallback to latin-1
  - Empty rows — preserved

## Output Shape
```python
List[str]  # one string per line/cell
```
