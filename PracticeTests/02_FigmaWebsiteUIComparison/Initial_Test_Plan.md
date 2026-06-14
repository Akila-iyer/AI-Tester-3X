# Visual UI Testing Platform — Architecture & Design Plan

> **Production-grade AI-powered Visual Regression Testing Platform**
> Built with B.L.A.S.T. Framework (Blueprint, Link, Architect, Stylize, Trigger)
> Portfolio-quality — designed for QA Automation Engineers, SDETs, and AI Engineers

---

## Table of Contents

1. [Phase 0: Project Memory](#-phase-0-initialization-project-memory)
2. [Phase 1: Blueprint — Vision & Architecture](#-phase-1-blueprint-vision--architecture)
3. [Module Architecture — All Engines](#-module-architecture)
4. [Confidence-Based Element Matching](#-confidence-based-element-matching)
5. [Comparison Capabilities Matrix](#-comparison-capabilities-matrix)
6. [AI Analysis Layer](#-ai-analysis-layer)
7. [Reporting System](#-reporting-system)
8. [Professional Web UI](#-professional-web-ui)
9. [Configuration System](#-configuration-system)
10. [History & Trends](#-history--trends)
11. [Data Schema](#-data-schema)
12. [Phase 2: Link — Dependencies](#-phase-2-link-connectivity)
13. [Phase 3: Architect — Implementation Phases](#-phase-3-architect-implementation-phases)
14. [Phase 4: Stylize — UX](#-phase-4-stylize-refinement--ui)
15. [Phase 5: Trigger — Deployment](#-phase-5-trigger-deployment)
16. [Future Roadmap](#-future-roadmap)
17. [Restrictions & Limitations](#-restrictions--limitations)

---

## 🟢 Phase 0: Initialization (Project Memory)

### Project Identity
- **Name:** Visual UI Testing Platform
- **Tagline:** AI-powered Figma-to-Website visual regression testing
- **Version:** 1.0.0

### Memory Files
| File | Purpose |
|------|---------|
| `gemini.md` | Project Constitution — data schemas, behavioral rules, architectural invariants |
| `task_plan.md` | Phases, goals, implementation checklist with dependencies |
| `findings.md` | Research discoveries, API constraints, known edge cases |
| `progress.md` | Build log, errors encountered, test results |

---

## 🏗️ Phase 1: Blueprint — Vision & Architecture

### North Star
Build a scalable AI-powered Visual Regression Testing platform that ingests a Figma design file and a live website URL, extracts all design properties from both sources, matches elements using a confidence-based heuristic, compares every visual dimension (typography, color, layout, spacing, images, states), runs accessibility checks, generates AI-powered root-cause explanations for each failure, and produces professional multi-format QA reports (Excel, HTML Dashboard, PDF, Markdown, JSON, CSV, Log) with history tracking and trend analysis.

### Architecture Principles
1. **Modular** — Each engine is standalone with a clear interface. Swap or upgrade any engine independently.
2. **Deterministic** — Same inputs always produce the same outputs. AI layer is optional post-processing.
3. **Lazy Evaluation** — Extract and compare engines produce intermediate results; only generate reports when requested.
4. **Fail Gracefully** — If Figma API fails, produce what you can from web-only analysis. Never crash.
5. **Pluggable** — Future engines (Jira, CI/CD, Slack, GitHub Actions) attach via adapter interfaces.

---

## 🏗️ Module Architecture

The platform is organized into **6 layers**, containing **15 engines**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 0: CONFIG                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Config       │  │  Session     │  │  Storage              │  │
│  │  Manager      │  │  Manager     │  │  Layer                │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      LAYER 1: EXTRACTION                         │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐  │
│  │  Figma Engine     │  │  Website Engine (Playwright)        │  │
│  │  - File parse     │  │  - DOM extraction                  │  │
│  │  - Styles API     │  │  - Computed styles                 │  │
│  │  - node hierarchy │  │  - Screenshot capture              │  │
│  │  - image export   │  │  - Responsive breakpoints          │  │
│  └──────────────────┘  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      LAYER 2: MATCHING                           │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  Element Matching Engine                                      ││
│  │  - Confidence-based weighted scoring                         ││
│  │  - 10+ signals (text, position, size, DOM, class, ARIA...)  ││
│  │  - Returns confidence score per matched pair                 ││
│  └──────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                      LAYER 3: COMPARISON                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │  Style    │ │  Layout  │ │  Visual  │ │  Screenshot Diff   │ │
│  │  Engine   │ │  Engine  │ │  Engine  │ │  Engine            │ │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├────────────────────┤ │
│  │Accessibil│ │Component │ │  Image   │ │  Responsive        │ │
│  │ity Engine│ │ Engine   │ │  Engine  │ │  Engine            │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      LAYER 4: INTELLIGENCE                       │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  AI Analysis Engine                                          ││
│  │  - Per-failure explanation (description, expected, actual,   ││
│  │    severity, root cause, suggested fix, confidence score)    ││
│  │  - Executive summary generation                              ││
│  │  - Natural language report generation                        ││
│  └──────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                      LAYER 5: OUTPUT                             │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  Report Generation Engine                                    ││
│  │  → Excel | HTML Dashboard | Markdown | PDF | JSON | CSV     ││
│  │  → Trend chart data | History snapshots                      ││
│  └──────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                      LAYER 6: PRESENTATION                       │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  Web UI (Flask + JS)                                         ││
│  │  8 pages: Dashboard | New Compare | Progress | Results       ││
│  │  | Detail Viewer | Screenshots | History | Settings          ││
│  │  Dark mode, responsive, downloadable reports                 ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Engine Specifications

#### 1. Figma Extraction Engine
- **Input:** Figma file key + Personal Access Token
- **API Calls:**
  - `GET /v1/files/{key}` — Full file JSON (nodes, styles, hierarchy)
  - `GET /v1/files/{key}/nodes?ids=...` — Specific node details
  - `GET /v1/images/{key}/...` — Export frames as PNG
- **Output:** Normalized element tree with positions, styles, text content, hierarchy
- **Edge cases:** Component instances, auto-layout, constraints, variants, nested frames
- **Caching:** Caches API response to `.tmp/figma_cache.json` to avoid rate limits

#### 2. Website Extraction Engine
- **Tool:** Playwright (headless Chromium)
- **Capabilities:**
  - Navigate to URL, wait for full load
  - Extract DOM tree with all computed styles
  - Capture full-page screenshot at multiple resolutions
  - Simulate viewport sizes (Desktop 1920x1080, Laptop 1440x900, Tablet 768x1024, Mobile 375x667)
  - Extract ARIA labels, accessibility tree, heading hierarchy
- **Output:** Normalized element tree with computed CSS properties, bounding rects, accessibility info

#### 3. Element Matching Engine
- **Purpose:** Match Figma nodes to DOM elements with confidence scoring
- **See dedicated section below**
- **Output:** List of `{figma_node_id, web_element_selector, confidence_score}`

#### 4. Visual Comparison Engine
- Coordination engine that routes matched pairs through all sub-comparators:
  - Style Comparison Engine
  - Layout Comparison Engine
  - Component Engine
  - Image Engine
  - Accessibility Engine
  - Responsive Engine

#### 5. Style Comparison Engine
- Compares all CSS-level properties between matched element pairs
- Typography, colors, borders, shadows, opacity, transforms

#### 6. Layout Comparison Engine
- Compares position, dimensions, margins, padding, flex/grid alignment
- Detects overlapping elements, hidden elements, overflow

#### 7. Screenshot Difference Engine
- Captures full-page screenshots from both Figma (exported) and web
- Uses pixel-level diffing (SSIM or pixel-by-pixel) to highlight visual regressions
- Generates diff overlay images with red/green highlights
- **Tool:** Pillow + numpy for pixel comparison

#### 8. Component Engine
- Detects missing elements, extra elements, incorrect hierarchy, duplicate components
- Uses element matching confidence scores + hierarchy traversal

#### 9. Image Engine
- Compares images between Figma and web
- Checks: presence, dimensions, aspect ratio, scaling, cropping
- SSIM diff for identical images

#### 10. Accessibility Engine
- Checks: contrast ratios (WCAG AA/AAA), font size readability, missing alt text, ARIA labels, heading hierarchy (h1→h2→h3 order), keyboard focus indicators
- Generates WCAG compliance report per element

#### 11. Responsive Engine
- Runs the entire comparison pipeline for multiple viewports
- Tracks which elements break/misalign at each breakpoint
- Reports responsive-specific issues

#### 12. AI Analysis Engine
- **See dedicated section below**
- Post-comparison intelligence layer

#### 13. Report Generation Engine
- **See dedicated section below**

#### 14. Project Configuration Manager
- Loads/saves configuration (YAML/JSON)
- Manages tolerance thresholds, ignored elements, viewport presets
- Profile system: save different configs for different projects

#### 15. Session Manager
- Creates unique session ID per comparison run
- Stores all intermediate data in session-scoped temp directory
- Tracks status: pending → extracting → matching → comparing → analyzing → reporting → complete → failed
- Enables resume/re-run capability

#### 16. Storage Layer
- Manages file I/O across `.tmp/` (intermediate) and `output/` (final payloads)
- Cleanup policy: auto-purge `.tmp/` after 24h
- History stored in `output/history/` as indexed JSON

#### 17. Logging Layer
- Centralized structured logging
- Log levels: DEBUG, INFO, WARN, ERROR
- Separate log files per session
- Console output during development

---

## 🎯 Confidence-Based Element Matching

### Problem
Simple position-based matching fails when:
- Figma uses auto-layout → positions shift in browser
- Elements are nested differently
- Dynamic content changes text length
- CSS frameworks (Bootstrap, Tailwind) add wrapper divs

### Weighted Scoring Algorithm

Each candidate match receives a score from **0.0 to 1.0**. Score ≥ threshold (default 0.7) = match.

| Factor | Weight | Description |
|--------|--------|-------------|
| **Text similarity** | 0.25 | Levenshtein ratio between Figma text and web text content |
| **Position proximity** | 0.20 | Euclidean distance between centers, normalized to [0,1] |
| **Size similarity** | 0.10 | Width/height ratio comparison |
| **Tag name match** | 0.10 | Figma node type vs HTML tag (e.g., TEXT → span/p/h1) |
| **Class/ID match** | 0.08 | Figma node name matches CSS class or id |
| **DOM hierarchy** | 0.08 | Parent chain similarity (breadcrumb depth + names) |
| **ARIA labels** | 0.05 | Figma node name matches aria-label or aria-labelledby |
| **Component name** | 0.05 | Figma component name matches a data attribute or component class |
| **Visibility** | 0.05 | Both are visible or both hidden |
| **Element type** | 0.04 | Button → button, Input → input, Image → img |
| **Accessibility role** | 0.03 | Figma node role matches ARIA role |

**Formula:**
```
confidence = Σ(weight_i × score_i) for all factors
```

**Decision:**
- `confidence ≥ 0.80` → Auto-match (high confidence)
- `0.60 ≤ confidence < 0.80` → Flag for AI review
- `confidence < 0.60` → Unmatched — report as missing/extra element

### Matching Heuristic Pipeline

1. **Exact match pass:** Perfect text match + perfect position match → confidence = 1.0, skip rest
2. **Text-based pass:** High text similarity (≥0.85) + reasonable position → likely match
3. **Position-based pass:** Close position + same tag type → likely match for non-text elements
4. **Hierarchy pass:** Same parent structure + similar position → match
5. **Fuzzy fallback:** All unmatched nodes → try all remaining candidates, pick highest confidence

### Output Structure
```json
{
  "matches": [
    {
      "figma_node_id": "1234:5678",
      "figma_name": "Header/Login Button",
      "web_selector": "#login-btn",
      "web_tag": "button",
      "confidence": 0.94,
      "matching_factors": {
        "text_similarity": 1.0,
        "position_proximity": 0.88,
        "size_similarity": 0.95,
        "tag_name_match": 1.0,
        "class_match": 0.0,
        "dom_hierarchy": 0.80,
        "aria_match": 0.0,
        "component_name": 0.0,
        "visibility": 1.0,
        "element_type": 1.0,
        "accessibility_role": 0.0
      }
    }
  ],
  "unmatched_figma": ["node_id1", "node_id2"],
  "unmatched_web": ["selector1", "selector2"]
}
```

---

## 📊 Comparison Capabilities Matrix

### Typography
| Property | Comparison | Tolerance |
|----------|-----------|-----------|
| Font family | Exact string match | — |
| Font size | Numeric (px) | ±1px |
| Font weight | Numeric | ±100 (if numeric) |
| Letter spacing | Numeric (px) | ±0.5px |
| Line height | Numeric (px or ratio) | ±2px |
| Text alignment | Exact match | — |
| Text decoration | Exact match | — |
| Text transform | Exact match | — |
| Word spacing | Numeric | ±1px |
| White-space | Set-based | — |

### Colors
| Property | Comparison | Tolerance |
|----------|-----------|-----------|
| Text color | RGBA delta-E | ΔE ≤ 2.0 |
| Background color | RGBA delta-E | ΔE ≤ 2.0 |
| Border color | RGBA delta-E | ΔE ≤ 2.0 |
| Gradient stops | Ordered list match | — |
| Opacity | Numeric | ±0.05 |
| Box shadow color | RGBA delta-E | ΔE ≤ 3.0 |

### Layout
| Property | Comparison | Tolerance |
|----------|-----------|-----------|
| Width | Numeric (px) | configurable (default ±2px) |
| Height | Numeric (px) | configurable (default ±2px) |
| X position | Numeric (px) | configurable (default ±2px) |
| Y position | Numeric (px) | configurable (default ±2px) |
| Margin (top/right/bottom/left) | Numeric (px) | ±2px |
| Padding (top/right/bottom/left) | Numeric (px) | ±2px |
| Border radius | Numeric (px) | ±1px |
| Border width | Numeric (px) | ±1px |
| Flex direction | Exact match | — |
| Flex alignment | Exact match | — |
| Grid alignment | Exact match | — |
| Grid column/row | Numeric | ±1 |
| Overflow | Exact match | — |
| Z-index | Numeric | — |
| Display | Set-based | — |
| Position type | Exact match | — |
| Float/clear | Exact match | — |
| Visibility | Boolean | — |

### Components
| Check | Logic |
|-------|-------|
| Missing elements | Figma node with no web match at confidence ≥ 0.6 |
| Extra elements | Web element with no Figma match at confidence ≥ 0.6 |
| Incorrect hierarchy | Parent-child chain differs between matched pairs |
| Duplicate components | Same Figma node matched to multiple web elements |
| Wrong element type | Figma "Button" matched to web `<div>` instead of `<button>` |

### Images & Icons
| Check | Method |
|-------|--------|
| Missing image | Web element with `<img>` but no Figma match |
| Incorrect dimensions | Width/height differ > tolerance |
| Scaling issues | Aspect ratio differs from Figma |
| Cropping | Visible area differs from Figma frame |
| Broken image | `<img>` with 404 or 0-size |

### Buttons & Interactive Elements
| Check | Detail |
|-------|--------|
| Size | Width/height match |
| Color | Background + text color match |
| Border radius | Match |
| Hover state | Separate comparison (future) |
| Disabled state | Separate comparison (future) |
| Focus state | Separate comparison (future) |
| Cursor style | Exact match |
| Transition | Duration + timing function |

### Forms
| Check | Detail |
|-------|--------|
| Input fields | Present, correct type |
| Labels | Associated correctly |
| Placeholder text | Present + font match |
| Validation styling | Color, font, icon |
| Error messages | Position, color, font |
| Required markers | Asterisk/icon present |

### Navigation
| Check | Detail |
|-------|--------|
| Navbar | Present, correct position, height |
| Links | All present, correct order |
| Dropdowns | Structure, trigger behavior |
| Active state | Current page highlighted |
| Breadcrumb | Order, separators |
| Footer | Present, link count, column structure |

### Responsive Layout
| Breakpoint | Viewport | Check |
|------------|----------|-------|
| Desktop | 1920×1080 | Primary layout |
| Laptop | 1440×900 | Header/footer behavior |
| Tablet | 768×1024 | Hamburger menu, column collapse |
| Mobile | 375×667 | Single column, font scaling, touch targets |

### Accessibility (WCAG 2.1 AA)
| Check | Standard | Method |
|-------|----------|--------|
| Contrast ratio | WCAG AA (4.5:1 normal, 3:1 large) | Color luminance calculation |
| Font readability | Minimum 12px body text | Font-size comparison |
| Missing alt text | All `<img>` must have alt | ARIA attribute check |
| ARIA labels | Interactive elements have labels | aria-label, aria-labelledby |
| Heading hierarchy | h1 → h2 → h3 (no skips) | DOM traversal |
| Keyboard focus | Focusable elements have visible focus | Tabindex + outline check |
| Focus order | Tab order follows visual order | Tabindex sequence check |
| Touch targets | Minimum 44×44px on mobile | Size check at mobile breakpoint |

---

## 🤖 AI Analysis Layer

### Purpose
After all deterministic comparisons complete, the AI engine adds intelligence: explaining *why* something failed in human terms, estimating severity, and suggesting fixes.

### Architecture
- **Mode:** Optional post-processing step (deterministic comparison runs without AI)
- **Tool:** Local LLM (Ollama/Llama) or OpenAI API (configurable)
- **Prompt:** Each failure is sent with context — expected, actual, element type, property
- **Fallback:** If AI unavailable, reports show deterministic results without AI explanations

### Per-Failure Output
```json
{
  "issue_id": "ISSUE-001",
  "element": "landing-hero-title",
  "property": "font-size",
  "expected": "48px",
  "actual": "32px",
  "severity": "high",
  "description": "Hero title font size is 32px in the browser but 48px in the Figma design.",
  "root_cause": "A mobile-first media query override is applying max-width:768px styles to desktop viewport.",
  "suggested_fix": "Remove or adjust the media query breakpoint from 768px to 576px, or add a min-width:992px override with font-size:48px.",
  "confidence_score": 0.87
}
```

### Severity Classification
| Severity | Criteria |
|----------|----------|
| **Critical** | Missing element, broken layout, invisible text, zero contrast |
| **High** | Wrong font size/color, incorrect position > 10px, missing navigation item |
| **Medium** | Minor spacing issue (±3-5px), slightly wrong shade, font-weight off by 100 |
| **Low** | Sub-pixel misalignment, anti-aliasing differences, rounding errors |

### Executive Summary
```json
{
  "overall_similarity": 87.3,
  "total_elements_compared": 142,
  "total_checks": 1136,
  "pass_count": 992,
  "fail_count": 144,
  "pass_percentage": 87.3,
  "by_severity": {
    "critical": 2,
    "high": 18,
    "medium": 45,
    "low": 79
  },
  "by_category": {
    "typography": {"pass": 230, "fail": 42, "pass_pct": 84.6},
    "colors": {"pass": 180, "fail": 12, "pass_pct": 93.3},
    "layout": {"pass": 340, "fail": 58, "pass_pct": 85.4},
    "accessibility": {"pass": 60, "fail": 8, "pass_pct": 88.2},
    "images": {"pass": 42, "fail": 4, "pass_pct": 91.3},
    "responsiveness": {"pass": 140, "fail": 20, "pass_pct": 87.5}
  },
  "top_issues": ["ISSUE-001", "ISSUE-003", "ISSUE-007"],
  "verdict": "FAIL — 144 issues found, 2 critical"
}
```

---

## 📋 Reporting System

### Output Formats

| Format | Use Case | Content |
|--------|----------|---------|
| **Excel** (.xlsx) | Share with team, import to test management | All checks with PASS/FAIL, color-coded, grouped by element |
| **HTML Dashboard** (.html) | Stakeholder review, portfolio demo | Interactive dashboard with charts, filters, screenshot viewer, side-by-side |
| **Markdown** (.md) | Attach to PRs, Jira tickets | Summary stats + diff table, AI explanations |
| **PDF** (.pdf) | Formal client reports | Professional layout with cover page, executive summary, charts |
| **JSON** (.json) | CI/CD pipeline consumption | Machine-readable structured data |
| **CSV** (.csv) | Import to spreadsheets | Flat table of all checks |
| **Log** (.log) | Debugging, traceability | Timestamped execution trace |

### HTML Dashboard Features
- Overall similarity percentage (large card, top-center)
- Pass rate gauge chart (circular progress)
- Severity breakdown (stacked bar chart)
- Category breakdown (horizontal bar chart)
- Comparison trends over time (line chart — from history data)
- Sortable/filterable issue table (by severity, category, status)
- Screenshot viewer with side-by-side + diff overlay mode
- Element detail drill-down (click any row → see all properties for that element)
- Export buttons (Excel, PDF from browser print)

### HTML Dashboard Layout
```
┌──────────────────────────────────────────────────────┐
│  Visual UI Testing Platform — Report #42              │
│  Project: Landing Page v2 | 14 Jun 2026 | 14:30:22   │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐   │
│  │             87.3% Similarity                    │   │
│  │    ┌─────┐  Pass: 992 | Fail: 144 | Total: 1136│   │
│  │    │ 87% │  Critical: 2  High: 18              │   │
│  │    └─────┘  Medium: 45   Low: 79               │   │
│  └────────────────────────────────────────────────┘   │
├──────────┬───────────────────────────────────────────┤
│ Severity │ Category                                  │
│ ┌──────┐ │ ┌──────┐                                  │
│ │ ████ │ │ │ ████ │ Typography   84.6%               │
│ │ ████ │ │ │ ████ │ Colors       93.3%               │
│ │ ████ │ │ │ ████ │ Layout       85.4%               │
│ │ ████ │ │ │ ████ │ Accessibility 88.2%               │
│ └──────┘ │ └──────┘                                  │
├──────────┴───────────────────────────────────────────┤
│ Filter: [All] [Critical] [High] [Medium] [Low]       │
│ ┌────┬──────────┬────────┬────────┬────────┬──────┐  │
│ │ #  │ Element  │ Property│Expected│ Actual │Sev   │  │
│ ├────┼──────────┼────────┼────────┼────────┼──────┤  │
│ │ 1  │ Hero Title│font-size│ 48px  │ 32px   │ HIGH │  │
│ │ 2  │ CTA Btn  │bg-color│ #4F46E5│#6366F1 │ MED  │  │
│ └────┴──────────┴────────┴────────┴────────┴──────┘  │
├──────────────────────────────────────────────────────┤
│ [Side-by-side Screenshot Viewer with Diff Overlay]   │
│  Figma (left) │ Web (center) │ Diff (right) 🟥🟩   │
└──────────────────────────────────────────────────────┘
```

---

## 🖥️ Professional Web UI

### Tech Stack
- **Backend:** Flask (Python) — lightweight, proven, easy to deploy
- **Frontend:** Vanilla JS + Chart.js (charts) + CSS custom properties (dark mode)
- **Templating:** Jinja2 with component-based includes

### Pages

#### 1. Home Dashboard (`/`)
- Welcome message + quick-start guide
- Recent comparison history (last 5 runs)
- Overall statistics (total comparisons, avg pass rate, trend arrow)
- Quick action: "New Comparison" button

#### 2. New Comparison (`/new`)
- Input fields: Figma URL, Web URL, Figma Token (masked)
- Configuration panel (expandable): tolerance sliders, viewport checkboxes, comparison categories toggles
- Advanced options: AI analysis toggle, ignore selectors, custom viewport sizes
- "Start Comparison" button

#### 3. Running Progress (`/progress/<session_id>`)
- Real-time status: Extracting Figma → Extracting Web → Matching → Comparing → Analyzing → Generating Reports
- Progress bar per stage
- Current action text (e.g., "Matching element 47/142...")
- Cancel button

#### 4. Results Dashboard (`/results/<session_id>`)
- Full HTML dashboard as described above
- Download buttons for all formats
- "View Details" link → drill-down page
- "Run Again" button
- "Compare with Previous" button

#### 5. Detailed Element Comparison (`/results/<session_id>/element/<element_id>`)
- Side-by-side property table (Figma vs Web vs Diff)
- For each property: property name, expected, actual, status, tolerance, AI explanation
- Screenshot crop of the specific element from both sources
- Hierarchy breadcrumb showing where this element lives

#### 6. Screenshot Viewer (`/results/<session_id>/screenshots`)
- Full-page screenshots: Figma, Web, Diff overlay
- Zoom in/out
- Side-by-side mode vs overlay mode toggle
- Hotspot markers for each failed element (clickable → jump to element detail)

#### 7. History (`/history`)
- Paginated table of all past comparisons
- Columns: Date, Project, Base URL, Compare URL, Pass Rate, Trend (↑↓→), Actions
- Search by project name or URL
- Filter by date range
- Trend mini-chart per row

#### 8. Settings (`/settings`)
- Default tolerance values (global + per-category overrides)
- Default viewport presets
- AI provider selection (None / Local Ollama / OpenAI API)
- Storage management (view cache size, clear cache button)
- Theme toggle (Light / Dark / System)

### Dark Mode
- CSS custom properties for all colors
- `prefers-color-scheme` media query default
- Manual toggle with localStorage persistence
- All charts use dark mode palette in dark mode

---

## ⚙️ Configuration System

### Configuration Sources (Loaded in Priority Order)
1. **CLI args** (highest priority) — for CI/CD overrides
2. **Session config** — UI settings per run
3. **Project profile** — Saved config for a specific project
4. **Global defaults** — `config/default.yaml`

### Configurable Parameters
```yaml
project:
  name: "Landing Page v2"
  figma_key: "abc123def456"
  figma_token_env: "FIGMA_TOKEN"
  web_url: "https://example.com/landing"

comparison:
  tolerance:
    position: 2        # px
    size: 2            # px
    color_delta_e: 2.0
    font_size: 1       # px
    font_weight: 100
    opacity: 0.05
    border_radius: 1   # px

  ignore:
    dynamic_text: true
    timestamps: true
    advertisements: true
    animations: true
    selectors:          # CSS selectors to skip
      - ".ads"
      - "[data-dynamic]"
      - "#live-chat"

  viewports:
    - name: "Desktop"
      width: 1920
      height: 1080
    - name: "Laptop"
      width: 1440
      height: 900
    - name: "Tablet"
      width: 768
      height: 1024
    - name: "Mobile"
      width: 375
      height: 667

  categories:
    typography: true
    colors: true
    layout: true
    accessibility: true
    images: true
    components: true
    responsive: true

ai:
  enabled: true
  provider: "openai"   # "none", "ollama", "openai"
  model: "gpt-4o-mini"
  api_key_env: "OPENAI_API_KEY"

history:
  enabled: true
  max_runs: 100
  storage: "output/history/"
```

---

## 📜 History & Trends

### Storage
- Each run stored as `output/history/{session_id}/summary.json`
- Central index: `output/history/index.json` — ordered list of all runs
- Summary JSON contains: session_id, timestamp, project name, URLs, pass rate, issue counts, config snapshot

### Trend Tracking
```json
{
  "runs": [
    {"id": "a1b2c3d4", "date": "2026-06-01", "pass_rate": 92.1},
    {"id": "e5f6g7h8", "date": "2026-06-07", "pass_rate": 89.4},
    {"id": "i9j0k1l2", "date": "2026-06-14", "pass_rate": 87.3}
  ],
  "trend": "decreasing",
  "avg_pass_rate": 89.6,
  "most_common_issue_categories": ["Typography", "Layout"],
  "most_failed_elements": ["hero-title", "cta-button"]
}
```

### Trend Chart (on Dashboard + History page)
- Line chart: pass rate over time (x = date, y = pass rate %)
- Each point clickable → opens that run's results

---

## 💾 Data Schema

### Full Data Flow
```
Figma JSON ──→ Normalized Figma Tree ──┐
                                        ├──→ Matched Pairs ──→ Comparison Results ──→ Reports
Web DOM   ──→ Normalized Web Tree ─────┘
```

### Core Data Types

#### Normalized Element
```json
{
  "source": "figma|web",
  "id": "unique_id",
  "name": "Hero Title",
  "type": "text|rectangle|button|image|frame|group",
  "tag": "h1|p|button|img|div|a",
  "bounding_box": {"x": 100, "y": 200, "width": 600, "height": 48},
  "styles": {
    "typography": {
      "font_family": "Inter",
      "font_size": 48,
      "font_weight": 700,
      "letter_spacing": -0.5,
      "line_height": 56,
      "text_align": "center",
      "text_decoration": "none",
      "text_transform": "none"
    },
    "colors": {
      "color": {"r": 0.1, "g": 0.1, "b": 0.2, "a": 1.0},
      "background_color": {"r": 1.0, "g": 1.0, "b": 1.0, "a": 0.0},
      "border_color": null,
      "opacity": 1.0,
      "box_shadow": null
    },
    "layout": {
      "margin": {"top": 0, "right": 0, "bottom": 16, "left": 0},
      "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0},
      "border_radius": 0,
      "border_width": 0,
      "display": "block",
      "flex_direction": null,
      "justify_content": null,
      "align_items": null,
      "z_index": 1,
      "overflow": "visible"
    }
  },
  "content": "Welcome to Our Platform",
  "hierarchy": {
    "parent_id": "frame_header",
    "children": [],
    "depth": 2,
    "breadcrumb": ["root", "frame_header", "hero_title"]
  },
  "accessibility": {
    "role": "heading",
    "aria_label": null,
    "aria_labelledby": null,
    "alt_text": null,
    "tab_index": 0,
    "heading_level": 1
  }
}
```

#### Matched Pair
```json
{
  "figma_id": "figma_node_123",
  "web_selector": "#hero-title",
  "confidence": 0.94,
  "confidence_factors": {...}
}
```

#### Comparison Result
```json
{
  "element_id": "hero-title",
  "figma": {...},
  "web": {...},
  "checks": [
    {
      "category": "typography",
      "property": "font_size",
      "expected": 48,
      "actual": 32,
      "unit": "px",
      "status": "FAIL",
      "tolerance": 1,
      "difference": -16,
      "severity": "high",
      "ai_explanation": {
        "description": "...",
        "root_cause": "...",
        "suggested_fix": "...",
        "confidence": 0.87
      }
    }
  ]
}
```

---

## 🔗 Phase 2: Link — Connectivity

### Dependencies
```
# Core
flask>=3.0
playwright>=1.40
requests>=2.31
pillow>=10.0
numpy>=1.24
openpyxl>=3.1
pyyaml>=6.0

# Reporting
weasyprint>=60.0          # PDF generation
jinja2>=3.1               # HTML dashboard template
chart.js (CDN)            # Charts in HTML dashboard

# AI (optional)
openai>=1.0               # OpenAI API
ollama (optional)         # Local LLM
```

### Connection Verification
1. **Figma API** — `GET /v1/me` with token → 200 OK
2. **Playwright** — `playwright install chromium` → binary present
3. **AI Provider** (optional) — API key check + test completion

---

## ⚙️ Phase 3: Architect — Implementation Phases

### Phase 3.1: Project Scaffolding
- Create folder structure
- Initialize all project memory files
- Set up logging layer and config manager

### Phase 3.2: Extraction Engines
- Build Figma Extraction Engine
- Build Website Extraction Engine (Playwright)
- Write SOPs: `01_figma_extraction.md`, `02_web_extraction.md`

### Phase 3.3: Element Matching Engine
- Build confidence-based matcher with all 11 factors
- Write SOP: `03_element_matching.md`

### Phase 3.4: Comparison Engines
- Build Style Comparison Engine
- Build Layout Comparison Engine
- Build Component Engine
- Build Image Engine
- Build Accessibility Engine
- Build Responsive Engine
- Build Screenshot Difference Engine
- Write SOP: `04_comparison.md`

### Phase 3.5: AI Analysis Engine
- Build AI analysis processor
- Integrate with OpenAI / Ollama
- Build severity classifier
- Write SOP: `05_ai_analysis.md`

### Phase 3.6: Report Generation
- Build Excel reporter
- Build HTML Dashboard with Chart.js
- Build Markdown reporter
- Build PDF reporter (weasyprint)
- Build JSON/CSV exporters
- Write SOP: `06_report_generation.md`

### Phase 3.7: Web UI
- Build all 8 pages
- Implement dark mode
- Implement responsive layout
- Build history and settings pages

### Phase 3.8: Integration & Testing
- End-to-end test with real Figma file + real website
- Edge case testing (missing token, bad URL, empty page, large files)
- Performance optimization (caching, lazy loading)

### Folder Structure
```
02_FigmaWebsiteUIComparison/
├── gemini.md
├── task_plan.md
├── findings.md
├── progress.md
├── config/
│   ├── default.yaml
│   └── schema.py
├── architecture/
│   ├── 01_figma_extraction.md
│   ├── 02_web_extraction.md
│   ├── 03_element_matching.md
│   ├── 04_comparison.md
│   ├── 05_ai_analysis.md
│   └── 06_report_generation.md
├── engines/
│   ├── __init__.py
│   ├── figma_extractor.py
│   ├── web_extractor.py
│   ├── element_matcher.py
│   ├── comparison/
│   │   ├── __init__.py
│   │   ├── style_comparator.py
│   │   ├── layout_comparator.py
│   │   ├── component_comparator.py
│   │   ├── image_comparator.py
│   │   ├── accessibility_checker.py
│   │   └── responsive_comparator.py
│   ├── screenshot_diff.py
│   ├── ai_analyzer.py
│   └── reporter/
│       ├── __init__.py
│       ├── excel_reporter.py
│       ├── html_reporter.py
│       ├── markdown_reporter.py
│       ├── pdf_reporter.py
│       ├── json_reporter.py
│       └── csv_reporter.py
├── session/
│   ├── __init__.py
│   ├── manager.py
│   └── models.py
├── storage/
│   ├── __init__.py
│   └── manager.py
├── logging/
│   ├── __init__.py
│   └── logger.py
├── ui/
│   ├── app.py
│   ├── forms.py
│   └── routes/
│       ├── __init__.py
│       ├── dashboard.py
│       ├── comparison.py
│       ├── results.py
│       ├── history.py
│       └── settings.py
├── templates/
│   ├── base.html
│   ├── dashboard.html
│   ├── new_comparison.html
│   ├── progress.html
│   ├── results.html
│   ├── element_detail.html
│   ├── screenshot_viewer.html
│   ├── history.html
│   ├── settings.html
│   └── components/
│       ├── navbar.html
│       ├── sidebar.html
│       ├── summary_cards.html
│       ├── charts.html
│       ├── issue_table.html
│       └── screenshot_viewer.html
├── static/
│   ├── css/
│   │   ├── main.css
│   │   ├── dark.css
│   │   └── dashboard.css
│   ├── js/
│   │   ├── main.js
│   │   ├── charts.js
│   │   └── dashboard.js
│   └── img/
├── output/
│   ├── reports/
│   └── history/
└── .tmp/
    ├── figma/
    ├── web/
    └── screenshots/
```

---

## ✨ Phase 4: Stylize — Refinement & UI

### Visual Design Principles
- **Clean & professional** — Indigo/navy primary (#1a1a2e, #4f46e5), clean whitespace
- **Data-first** — Numbers, charts, and comparison tables are hero elements
- **Accessible** — WCAG AA contrast ratios, readable fonts, proper focus indicators
- **Consistent** — Same component library (buttons, cards, tables) across all pages
- **Responsive** — UI works on desktop and tablet; mobile-optimized for results viewing only

### UI Component Library
| Component | Style |
|-----------|-------|
| Buttons | Pill-shaped, indigo primary, white ghost, red danger |
| Cards | White bg, subtle shadow, rounded-12, hover lift |
| Tables | Striped rows, sticky header, sortable columns |
| Forms | Clean bordered inputs, floating labels, validation states |
| Charts | Chart.js, indigo/green/red/amber palette, dark mode aware |
| Modals | Centered, backdrop blur, slide-in animation |
| Toasts | Top-right, auto-dismiss, color-coded (success/error/warn) |
| Tooltips | Bottom, dark bg, subtle arrow |
| Filters | Dropdown + chips + clear all |

---

## 🛰️ Phase 5: Trigger — Deployment

### Local Development
```bash
cd PracticeTests/02_FigmaWebsiteUIComparison
pip install -r requirements.txt
playwright install chromium
python ui/app.py
# Open http://localhost:5000
```

### CI/CD Integration (Future)
- `pytest` test suite for each engine
- GitHub Actions workflow:
  - On PR: run comparison against staging URL
  - Comment PR with pass rate + link to HTML report
  - Fail PR if pass rate below threshold

### Docker (Future)
```dockerfile
FROM python:3.12-slim
RUN playwright install chromium
COPY . /app
CMD ["python", "ui/app.py"]
```

---

## 🗺️ Future Roadmap

| Feature | Description |
|---------|-------------|
| **Jira Integration** | Auto-create tickets for failed comparisons |
| **Slack/Teams Notifications** | Post summary to channel after run |
| **GitHub Actions Plugin** | Run comparison as part of CI pipeline |
| **Batch Execution** | JSON manifest with N page pairs → N reports |
| **AI Chat Assistant** | Ask questions: "What changed between last week and now?" |
| **Multi-Project Dashboard** | Compare across projects, filter by team |
| **Live Diff Stream** | Watch comparison happen element by element in real-time |
| **Component Library Sync** | Compare against Storybook/Pattern library instead of Figma |
| **Mobile App Testing** | Run comparison on emulated iOS/Android webviews |

---

## ⚠️ Restrictions & Limitations

| Restriction | Mitigation |
|------------|------------|
| Figma renders vectors differently than browsers | Use configurable tolerance, not exact match |
| Scanned PDF / image-only designs not supported | Not applicable — this is for live web, not PDF |
| Figma API rate limits (200 req/min on free) | Cache responses, use `.tmp/` |
| Anti-aliasing differences between OS/Browser | Low-severity flag + info label |
| Figma auto-layout vs CSS flexbox | Weighted matching accounts for this |
| Dynamic content won't match static Figma text | Configurable "ignore dynamic text" toggle |
| Hover/animations require separate Figma frames | Per-state comparison as separate session |
| Font availability in browser vs Figma | Flag as font-loading issue, not layout failure |
| AI analysis requires API key (optional) | Deterministic comparison works without AI |

### Accuracy Estimate
| Category | Accuracy |
|----------|----------|
| Typography (font, size, weight, color) | 90% |
| Element positions (within tolerance) | 90% |
| Element dimensions | 95% |
| Button/link colors, border-radius | 90% |
| Text spacing, padding | 85% |
| Background colors | 95% |
| Accessibility (contrast, ARIA, headings) | 95% |
| Missing/extra elements | 85% |
| Box shadows, gradients | 70% (informational) |
| Overlap detection | 80% |
| Hover/animations | 60% (separate session) |
| Exact pixel-perfect | Not possible |

**Overall: 85-92% of visual bugs caught automatically.**

---

*Architecture designed: 2026-06-14 | B.L.A.S.T. Framework v2 | Visual UI Testing Platform v1.0.0*
