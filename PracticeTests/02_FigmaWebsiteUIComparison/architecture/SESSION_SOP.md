# Session SOP — Lifecycle & State Machine

## Session Identity
- Each comparison run gets a unique UUID v4 session ID
- All session data stored in `.tmp/sessions/{session_id}/`

## State Machine

```
                         ┌─────────┐
                         │ pending │
                         └────┬────┘
                              │ coordinator starts
                              ▼
                       ┌─────────────┐
               ┌───────│ extracting  │───────┐
               │       └─────────────┘       │
               │            │                │
               │            ▼                │
               │       ┌───────────┐         │
               │       │ matching  │         │
               │       └─────┬─────┘         │
               │             │               │
               │             ▼               │
               │      ┌────────────┐         │
               │      │ comparing  │         │
               │      └──────┬─────┘         │
               │             │               │
               │        ┌────┴────┐          │
               │        ▼         ▼          │
               │  ┌─────────┐ ┌──────┐       │
               │  │analyzing│ │skip  │       │
               │  └────┬────┘ └──┬───┘       │
               │       │        │            │
               │       ▼        ▼            │
               │   ┌──────────────┐          │
               │   │  reporting   │          │
               │   └──────┬───────┘          │
               │          │                  │
               │          ▼                  │
               │   ┌──────────┐      ┌───────┘
               │   │ complete │      │
               │   └──────────┘      │
               │                     │
               └─────────────────────┘ → failed
```

Any state can transition to `failed` on unrecoverable error.

## Session Directory Structure
```
.tmp/sessions/{session_id}/
├── session.json           # Session metadata + config snapshot
├── figma_elements.json    # Normalized Figma elements
├── web_elements.json      # Normalized web elements (per viewport)
├── matched_pairs.json     # Matched pairs with confidence scores
├── comparison_results.json # All comparison check results
├── ai_analysis.json       # AI explanations (if enabled)
├── summary.json           # Final summary
└── screenshots/
    ├── figma_desktop.png
    ├── web_desktop.png
    ├── diff_desktop.png
    ├── web_laptop.png
    └── ...
```

## Session JSON Schema
```json
{
  "id": "uuid-string",
  "status": "pending | extracting | matching | comparing | analyzing | reporting | complete | failed",
  "created_at": "ISO-8601",
  "completed_at": "ISO-8601 | null",
  "config": { ... },
  "summary": null | { ... }
}
```

## History Storage
- Central index: `output/history/index.json`
- Ordered list of all runs: `[{id, date, pass_rate, status, figma_url, web_url}]`
- Limited to `config.history.max_runs` (default: 100)
- Each run's full data stored in `output/history/{id}/summary.json` (copy of session summary)
