# Comparison Engine Refactor — Professional Visual Regression Testing

## Goal
Refactor the comparison engine to report only **meaningful** UI differences. Introduce profiles, WARNING/IGNORED statuses, color normalization, component-grouped results, and property group configuration.

---

## Files to Modify (25+ files)

### Phase 1: Config Foundation
- `config/schema.py` — Add `ProfileConfig`, `PropertyGroupConfig`, update `ToleranceConfig`
- `config/default.yaml` — Mirror: 3 profiles (STRICT/STANDARD/RELAXED), property_groups section

### Phase 2: Utility Layer (NEW)
- `utils/__init__.py` — Empty package marker
- `utils/normalization.py` — `IGNORED_PROPERTIES` set, `normalize_color()`, `normalize_text_align()`, `normalize_color_to_str()`, `classify_property()`

### Phase 3: Comparator Updates
- `color_comparator.py` — Fix [object Object] bug via normalize_color(), transparent==rgba(0,0,0,0)
- `style_comparator.py` — text-align normalization (left==start, right==end)
- `layout_comparator.py` — Remove display/overflow checks, add margin/padding tolerances, WARNING at 1.5×tolerance
- `component_comparator.py` — Tag/hierarchy/type → IGNORED (not FAIL), keep content/alt/aria/role
- `accessibility_comparator.py` — No major changes
- `image_comparator.py` — No major changes
- `responsive_comparator.py` — No major changes

### Phase 4: Post-Processing
- `fp_reducer.py` — Update patterns to accept tolerance dict
- `component_scorer.py` — WARNING doesn't reduce score, IGNORED excluded, output passed/warnings/failures/ignored
- `failure_grouper.py` — Exclude IGNORED, add warning_groups

### Phase 5: AI & Reporting
- `ai_analyzer.py` — Add ignored_differences/warnings/critical_failures to prompt
- `json_reporter.py` — Add warnings/ignored/profile
- `html_reporter.py` — WARNING/IGNORED badges, component-grouped table, profile badge
- `excel_reporter.py` — WARNING/IGNORED columns, profile metadata sheet

### Phase 6: Orchestration
- `coordinator.py` — Profile loading, property group filtering, enhanced summary
- `api.py` — Accept profile/property_groups, return new fields

### Phase 7: Frontend
- `StatusBadge.jsx` — Add WARNING (yellow), IGNORED (gray)
- `SummaryCards.jsx` — Add Warnings, Ignored cards
- `Results.jsx` — Tabbed: Component Grouped / Flat Issues, profile badge
- `ElementDetail.jsx` — Component score, IGNORED section, WARNING indicators
- `Settings.jsx` — Profile selector (3 buttons), Property Groups toggles (advanced disabled)
- `IssueTable.jsx` — WARNING/IGNORED rows with appropriate styling

### Phase 8: Documentation
- `task_plan.md`, `progress.md`, `findings.md`

---

## Verification
1. `normalize_color(None)` → None, `normalize_color({'r':'255','g':0,'b':0,'a':'1'})` → `{r:255,g:0,b:0,a:1.0}`
2. Smoke test: POST /api/comparisons with `profile: STRICT` → tolerances tightened
3. WARNING checks don't reduce component score pass_pct
4. IGNORED properties in separate section, not failure table
5. Settings page: switching profiles works
6. `npx vite build` — 0 errors
