# Element Matching SOP

## Strategy: 3-Phase Confidence-Based Matching

### Phase 1 — Exact Match (confidence = 1.0)
Match if ALL conditions met:
- Same tag type (h1→h1, button→button, etc.)
- Same text content (case-sensitive, trimmed)
- Position within tolerance (±tolerance.position px on x and y)
- Size within tolerance (±tolerance.size px on width and height)
- Same depth in hierarchy

If matched, skip further phases for this element pair.

### Phase 2 — Heuristic Match (confidence 0.6–0.99)

For each unmatched Figma element, score all unmatched web elements using weighted factors:

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Position proximity | 0.40 | `1 - (euclidean_distance / max(500, viewport_max_dim))` |
| Size similarity | 0.30 | `1 - (abs(w_fig - w_web)/max(w_fig, w_web) + abs(h_fig - h_web)/max(h_fig, h_web)) / 2` |
| Type match | 0.20 | 1.0 if same type/tag, 0.5 if compatible (h1↔h2, div↔section), 0.0 otherwise |
| Content similarity | 0.10 | Basic substring overlap for text elements; 0 for non-text |

**Confidence = Σ(weight_i × score_i)**

- confidence ≥ **0.80** → auto-match (add to matched pairs)
- confidence ≥ **0.60** → flag for AI review (include in output but mark as "uncertain")
- confidence < **0.60** → leave unmatched (report as missing/extra)

### Phase 3 — Unmatched Reporting
- Figma elements with no web match → added to `unmatched_figma`
- Web elements with no Figma match → added to `unmatched_web`
- Unmatched Figma elements generate FAIL checks (missing from web)
- Unmatched web elements generate INFO flags (extra elements found)

### Confidence Factors Output
Each MatchedPair includes a `confidence_factors` dict with the raw score for each factor, enabling debugging and AI explanation.

### Tolerance Configuration
```yaml
tolerance:
  position: 2        # px
  size: 2            # px
```
