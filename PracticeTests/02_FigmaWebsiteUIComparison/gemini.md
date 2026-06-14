# Gemini — Project Constitution

## Visual UI Testing Platform v1.0.0

### Identity
- **Name:** Visual UI Testing Platform
- **Purpose:** AI-powered Figma-to-Website visual regression testing
- **Stack:** Python (backend/engines) + React + Vite + Tailwind CSS (frontend)
- **Framework:** B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger)

---

## Architecture Invariants

1. **Modular engines** — Each engine has a single responsibility with a well-defined interface.
2. **Deterministic core** — Comparison logic is deterministic. AI analysis is an optional post-processing layer.
3. **Lazy evaluation** — Extraction and comparison produce intermediate results; reports are generated on demand.
4. **Fail gracefully** — If any engine fails, the rest continue. Partial results are always preferred over crashes.
5. **Session isolation** — Every comparison run creates a unique session. Sessions do not interfere.

---

## Data Schema

### Normalized Element
```json
{
  "source": "figma | web",
  "id": "string",
  "name": "string",
  "type": "text | rectangle | button | image | frame | group",
  "tag": "h1 | p | button | img | div | a | span | input | select | textarea | nav | header | footer | section",
  "bounding_box": { "x": 0, "y": 0, "width": 0, "height": 0 },
  "styles": {
    "typography": {},
    "colors": {},
    "layout": {}
  },
  "content": "string",
  "hierarchy": { "parent_id": "string", "children": [], "depth": 0, "breadcrumb": [] },
  "accessibility": {}
}
```

### Matched Pair
```json
{
  "figma_id": "string",
  "web_selector": "string",
  "confidence": 0.0,
  "confidence_factors": {}
}
```

### Comparison Result
```json
{
  "element_id": "string",
  "checks": [{ "category": "string", "property": "string", "expected": {}, "actual": {}, "status": "PASS | FAIL", "severity": "critical | high | medium | low" }]
}
```

### Session
```json
{
  "id": "string",
  "status": "pending | extracting | matching | comparing | analyzing | reporting | complete | failed",
  "config": {},
  "created_at": "ISO timestamp",
  "completed_at": "ISO timestamp | null",
  "summary": {}
}
```

---

## Behavioral Rules

- Compare ALL visible elements — no skips unless configured.
- Same inputs always produce the same deterministic comparison results.
- Differences under configured tolerance are reported as PASS.
- AI explanations are best-effort and never override deterministic PASS/FAIL.
- All intermediate files go in `.tmp/`. All final reports go in `output/`.

---

## Project Structure
```
02_FigmaWebsiteUIComparison/
├── gemini.md              # This file — law
├── task_plan.md           # Implementation checklist
├── findings.md            # Research & discoveries
├── progress.md            # Build log
├── config/                # Configuration
├── architecture/          # SOPs
├── engines/               # Python comparison engines
├── session/               # Session management
├── storage/               # File I/O
├── logging/               # Centralized logging
├── ui/                    # Flask routes (future)
├── frontend/              # React + Vite + Tailwind
├── templates/             # Jinja2 fallback (future)
├── output/                # Generated reports
└── .tmp/                  # Intermediate files
```

---

*Last updated: 2026-06-14*
