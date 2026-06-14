# Findings — Visual UI Testing Platform

## Research Log

### 2026-06-14 — Phase 1 Start

**Decision: React + Vite + Tailwind for frontend**
- Chosen over plain Flask/Jinja2 for production-quality UI
- Tailwind enables rapid consistent styling with dark mode support
- Vite provides fast HMR, optimized builds, and modern JS tooling
- React component model maps cleanly to dashboard UI patterns (cards, charts, tables, modals)

**Decision: React Router for client-side routing**
- 8 distinct pages with shared layout
- Session-based URL params for results/progress/screenshots
- Keeps backend simple (Flask API only, no server-side rendering)

**Decision: Chart.js with react-chartjs-2**
- Lightweight, well-maintained, dark mode capable
- Sufficient for bar charts, line charts, doughnut charts (no need for D3 complexity)
- Compared to Recharts: smaller bundle, more customizable

**Decision: No backend yet in Phase 1**
- Phase 1 is pure frontend — all data structures defined, ready for API integration
- Mock data used for UI development
- Ensures UI is fully polished before backend integration

### Figma API Constraints (from research)
- Rate limit: 200 requests/min on free tier
- File key format: `figma.com/file/{key}/{name}`
- Node IDs are strings in format `{canvas_id}:{node_id}`
- Styles API returns raw values in Figma units (px, pt, RGBA 0-1 range)
- Auto-layout properties: `layoutMode`, `primaryAxisAlignItems`, `counterAxisAlignItems`, `padding*`, `itemSpacing`

### Playwright Constraints (from research)
- Full page screenshots require scrolling + stitching for pages > viewport
- Computed styles are always in px (even if CSS uses rem/em/%)
- `getBoundingClientRect()` is relative to viewport, not document
- Shadow DOM elements need special traversal (`shadowRoot`)
- iframes are isolated — separate context needed

### 2026-06-14 — Phase 2: Link (Connectivity)

**Environment Setup**
- Python 3.14 venv created at `venv/`
- All dependencies installed (flask, playwright, requests, pillow, numpy, openpyxl, pyyaml, python-dotenv, jinja2, weasyprint, openai)
- Playwright Chromium browser downloaded (181.9 MB)
- `.env` template created with FIGMA_TOKEN, OPENAI_API_KEY, OLLAMA vars
- `.gitignore` created with venv, .env, __pycache__, .tmp/ exclusions

**Handshake Results**

1. **Figma API** — SKIPPED (FIGMA_TOKEN not set in .env)
2. **Playwright (Web Extraction)** — OK
   - Navigated to https://example.com
   - Extracted title: "Example Domain", h1: "Example Domain"
   - Computed styles extracted: font-family, font-size (24px), font-weight (700), color, text-align
   - Playwright 1.60.0, Chromium headless, 1920x1080 viewport
3. **OpenAI** — SKIPPED (OPENAI_API_KEY not set in .env)
4. **Ollama** — Server reachable at localhost:11434, model `llama3.2` not pulled

**Key Discovery: eval_on_selector API change**
- Playwright 1.60 removed `default_value` kwarg from `eval_on_selector`
- Fixed by using `query_selector` + conditional `get_attribute` pattern
- Important for future engine code that uses Playwright selectors
