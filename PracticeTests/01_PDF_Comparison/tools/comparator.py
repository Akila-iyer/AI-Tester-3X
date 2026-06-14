"""Tool: Compare two lists of strings line-by-line."""

from typing import List, Dict


def compare(base_lines: List[str], compare_lines: List[str]) -> List[Dict]:
    """
    Compare base vs compare line-by-line.
    Returns list of dicts with line_number, base_text, compare_text, status.
    """
    max_len = max(len(base_lines), len(compare_lines))
    results = []

    for i in range(max_len):
        base = base_lines[i] if i < len(base_lines) else ""
        comp = compare_lines[i] if i < len(compare_lines) else ""
        status = "PASS" if base == comp else "FAIL"

        results.append({
            "line_number": i + 1,
            "base_text": base,
            "compare_text": comp,
            "status": status,
        })

    return results


def summarize(results: List[Dict]) -> Dict:
    """Generate summary stats from comparison results."""
    total = len(results)
    pass_count = sum(1 for r in results if r["status"] == "PASS")
    fail_count = total - pass_count
    pass_pct = round((pass_count / total * 100), 2) if total > 0 else 0.0

    return {
        "total_lines": total,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "pass_percentage": pass_pct,
    }
