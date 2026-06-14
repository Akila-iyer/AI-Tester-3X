# Architecture Overview — Visual UI Testing Platform

## 6-Layer System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                   LAYER 0: FOUNDATION (config, logging, storage,   │
│                              session, __init__.py)                  │
├─────────────────────────────────────────────────────────────────────┤
│                   LAYER 1: EXTRACTION                               │
│  FigmaExtractor (API or mock)  WebExtractor (Playwright)           │
│       ↓ NormalizedElement[]         ↓ NormalizedElement[]          │
├─────────────────────────────────────────────────────────────────────┤
│                   LAYER 2: MATCHING                                 │
│  ElementMatcher — 3-phase confidence-based matching                │
│       ↓ MatchedPair[]                                              │
├─────────────────────────────────────────────────────────────────────┤
│                   LAYER 3: COMPARISON (7 engines)                   │
│  Style | Color | Layout | Component | Image | Accessibility | Resp │
│       ↓ ComparisonResult[]                                         │
├─────────────────────────────────────────────────────────────────────┤
│                   LAYER 4: INTELLIGENCE                             │
│  AIAnalyzer — OpenAI / Ollama (best-effort explanations)           │
│       ↓ AIAnalysis[]                                               │
├─────────────────────────────────────────────────────────────────────┤
│                   LAYER 5: OUTPUT                                   │
│  JSON Reporter | Excel Reporter | HTML Reporter                    │
├─────────────────────────────────────────────────────────────────────┤
│                   LAYER 6: PRESENTATION                             │
│  Flask API (REST) ←→ React+Vite Frontend (8 pages)                │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow (End-to-End)

```
User submits form (Figma URL + Web URL)
    │
    ▼
POST /api/comparisons → ComparisonCoordinator.run()
    │
    ├── 1. SessionManager.create() → status: "pending"
    ├── 2. SessionManager.update_status("extracting")
    │       ├── FigmaExtractor.extract() → NormalizedElement[]
    │       └── WebExtractor.extract() → NormalizedElement[]
    ├── 3. SessionManager.update_status("matching")
    │       └── ElementMatcher.match() → MatchedPair[]
    ├── 4. SessionManager.update_status("comparing")
    │       └── [Style, Color, Layout, Component, Image, A11y, Resp]
    │           → ComparisonResult[][]
    ├── 5. SessionManager.update_status("analyzing")
    │       └── AIAnalyzer.analyze() → AIAnalysis[]
    ├── 6. SessionManager.update_status("reporting")
    │       └── [JSON, Excel, HTML] reporters → output/{id}/
    └── 7. SessionManager.update_status("complete")
```

## Key Principles

1. **Deterministic core** — Comparison logic is deterministic (no randomness). AI is optional post-processing.
2. **Fail gracefully** — Each step is wrapped in try/except. Partial results are saved, remaining steps continue.
3. **Session isolation** — Every run gets a unique UUID. Sessions never interfere.
4. **Lazy evaluation** — Reports are generated on demand or at end of pipeline, not pre-computed.
5. **Mock-first** — Figma engine has a built-in mock mode so the full pipeline works without credentials.

## State Machine

```
pending → extracting → matching → comparing → analyzing → reporting → complete
    │          │            │           │            │           │
    └──────────┴────────────┴───────────┴────────────┴───────────┘ → failed
```
