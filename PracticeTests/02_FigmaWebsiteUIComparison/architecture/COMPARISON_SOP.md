# Comparison SOP — 7 Engines

## Common Interface

All comparators follow this signature:
```python
@staticmethod
def compare(figma_element: NormalizedElement, web_element: NormalizedElement, config: AppConfig) -> list[dict]:
```

Returns a list of check dicts:
```python
{
    "category": "typography",            # Engine-specific category
    "property": "font_size",             # Property name
    "expected": 48,                      # Figma value
    "actual": 32,                        # Web value
    "unit": "px",                        # Unit (px, rgb, %, etc.)
    "status": "FAIL",                    # PASS or FAIL
    "severity": "high",                  # critical | high | medium | low
    "difference": -16,                   # actual - expected
}
```

### Severity Classification (shared across all engines)
| Severity | Criteria |
|----------|----------|
| critical | Missing element, zero contrast, invisible text |
| high | Size/position diff > 20px, color ΔE > 5, wrong font-family |
| medium | Diff 5-20px, color ΔE 2-5, font-weight off by 100-200 |
| low | Diff < 5px, sub-pixel differences, anti-aliasing artifacts |

---

## 1. StyleComparator

Compares typography properties between matched pairs.

| Property | Tolerance | Comparison Method |
|----------|-----------|-------------------|
| font_family | exact | Case-insensitive string match |
| font_size | ±1px | Numeric diff |
| font_weight | ±100 | Numeric diff |
| letter_spacing | ±0.5px | Numeric diff |
| line_height | ±2px | Numeric diff |
| text_align | exact | String match |
| text_decoration | exact | String match |
| text_transform | exact | String match |

---

## 2. ColorComparator

Compares color properties using CIEDE2000 delta-E formula.

| Property | Tolerance | Default |
|----------|-----------|---------|
| color | ΔE ≤ tolerance | 2.0 |
| background_color | ΔE ≤ tolerance | 2.0 |
| border_color | ΔE ≤ tolerance | 3.0 |
| opacity | ±0.05 | Numeric diff |

### CIEDE2000 Implementation
- Convert sRGB to Lab color space
- Apply CIE2000 delta-E formula
- ΔE < 1: imperceptible difference
- ΔE 1-2: perceptible only under close inspection
- ΔE 2-5: noticeable difference
- ΔE > 5: obvious difference

---

## 3. LayoutComparator

Compares positioning and spacing.

| Property | Tolerance | Notes |
|----------|-----------|-------|
| x | ±2px | Position from bounding box |
| y | ±2px | Position from bounding box |
| width | ±2px | Element width |
| height | ±2px | Element height |
| margin (t/r/b/l) | ±2px | Each side separately |
| padding (t/r/b/l) | ±2px | Each side separately |
| border_radius | ±1px | |
| border_width | ±1px | |
| display | exact | block, flex, inline, etc. |
| opacity | ±0.05 | |
| overflow | exact | visible, hidden, scroll |

---

## 4. ComponentComparator

Checks structural and attribute correctness.

| Check | Logic |
|-------|-------|
| Tag match | Expected: button → Actual: button. FAIL if mismatch |
| Element presence | Figma element with no web match → critical FAIL |
| Extra elements | Web element with no Figma match → flagged as INFO |
| Attributes | href, src, alt, role presence/absence check |
| Hierarchy depth | Figma depth vs web depth within ±1 |
| Children count | Figma vs web child count (for frames/containers) |

---

## 5. ImageComparator (Screenshot Diff)

Pillow-based pixel comparison for screenshots.

1. Load Figma screenshot and web screenshot (from session storage)
2. Resize both to same dimensions (take larger dimension as base, scale smaller)
3. Pixel-diff via `ImageChops.difference()`
4. Calculate diff percentage: `diff_pixels / total_pixels * 100`
5. Generate diff overlay image with red highlight on changed pixels
6. Save diff to `.tmp/sessions/{id}/screenshots/diff_{viewport}.png`

For individual image elements (no full screenshot):
- Compare width, height, aspect ratio
- Check alt text presence

### Thresholds
| Diff % | Severity |
|--------|----------|
| > 5% | critical |
| 2-5% | high |
| 0.5-2% | medium |
| < 0.5% | low (anti-aliasing) |

---

## 6. AccessibilityComparator

WCAG 2.1 AA compliance checks.

| Check | Standard | Method |
|-------|----------|--------|
| Contrast ratio | WCAG AA 4.5:1 normal, 3:1 large | Relative luminance calculation |
| Alt text | All `<img>` must have alt | String presence check |
| ARIA labels | Interactive elements have aria-label | Attribute check |
| Font readability | Body text ≥ 12px | Font-size check |
| Heading hierarchy | h1→h2→h3 sequential (no skips) | DOM traversal + depth check |
| Focus indicators | Focusable elements have tabindex | Tabindex attribute check |

---

## 7. ResponsiveComparator

Compares element behavior across multiple viewports.

Requires at least 2 enabled viewports. For each matched element:
- Check if element exists at all viewports (hide/show at breakpoints)
- Compare position shifts across viewports
- Compare font-size scaling
- Flag elements that overlap or overflow at smaller viewports
- No Figma equivalent (informational only)

Output: list of responsive-specific checks with status based on expected mobile behavior patterns.
