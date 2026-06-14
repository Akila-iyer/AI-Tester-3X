# SOP 02: Line-by-Line Comparison

## Purpose
Compare two lists of text lines (base vs compare) and mark each line as PASS or FAIL.

## Algorithm
1. Pad the shorter list with empty strings to match the longer list's length
2. For each pair (base_line, compare_line):
   - If exact string match (case-sensitive) → PASS
   - Otherwise → FAIL
3. Collect results with line numbers (1-based)

## Edge Cases
- **Unequal line counts:** Extra lines in either file are compared against empty string → FAIL
- **Empty files:** No lines → summary shows 0 total
- **Whitespace:** NOT trimmed — exact comparison

## Output
```python
[
    {"line_number": 1, "base_text": "...", "compare_text": "...", "status": "PASS|FAIL"},
    ...
]
```
