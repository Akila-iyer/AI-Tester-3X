# API SOP — Flask REST Endpoints

## Base URL
- Development: `http://localhost:5000`
- All API routes prefixed with `/api`

## Endpoints

### POST /api/comparisons
Start a new comparison run.

**Request Body:**
```json
{
  "figma_url": "https://www.figma.com/file/abc123/MyDesign",
  "web_url": "https://example.com",
  "figma_token": "figd_...",            // optional, mock mode if empty
  "viewports": ["desktop", "laptop"],   // optional, defaults to enabled viewports
  "categories": ["typography", "colors", "layout", "components", "accessibility"],
  "ai_enabled": false,
  "ignore_selectors": [".ads", "[data-dynamic]"]
}
```

**Response (202 Accepted):**
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "status_url": "/api/comparisons/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status"
}
```

---

### GET /api/comparisons/{id}/status
Poll comparison progress.

**Response:**
```json
{
  "session_id": "a1b2c3d4...",
  "status": "extracting",
  "progress": {
    "current_stage": "Extracting web elements...",
    "stage_progress": 0.45,
    "elapsed_seconds": 12
  }
}
```

---

### GET /api/comparisons/{id}/results
Get full comparison results.

**Response:**
```json
{
  "session_id": "...",
  "status": "complete",
  "summary": { ... },
  "elements": [ ... ],
  "ai_analysis": [ ... ]
}
```

---

### GET /api/comparisons/{id}/elements/{element_id}
Get detailed view for a single matched element.

**Response:**
```json
{
  "element_id": "hero-title",
  "figma": { ... },
  "web": { ... },
  "checks": [ ... ],
  "ai_explanation": { ... }
}
```

---

### GET /api/comparisons/{id}/screenshots
Get screenshot URLs for a session.

**Response:**
```json
{
  "figma": "/screenshots/a1b2c3.../figma_desktop.png",
  "web": "/screenshots/a1b2c3.../web_desktop.png",
  "diff": "/screenshots/a1b2c3.../diff_desktop.png",
  "viewports": ["desktop", "laptop", "tablet", "mobile"]
}
```

---

### GET /api/comparisons/{id}/report/{format}
Download a generated report.
- `format`: `json`, `excel`, `html`

**Response:** Binary file download with appropriate Content-Type.

---

### GET /api/history
List recent comparison sessions.

**Query params:** `limit=25`, `offset=0`

**Response:**
```json
{
  "runs": [
    {
      "id": "...",
      "date": "2026-06-14T14:30:00Z",
      "figma_url": "...",
      "web_url": "...",
      "pass_rate": 87.3,
      "status": "complete",
      "duration_seconds": 45
    }
  ],
  "total": 42
}
```

---

### GET /api/settings
Get current configuration.

**Response:** Full AppConfig as JSON.

---

### PUT /api/settings
Update configuration values.

**Request Body:** Partial config object (deep-merged with current config).
**Response:** Updated AppConfig as JSON.

---

## Error Response Format
```json
{
  "error": "string",
  "details": {}
}
```

HTTP Status Codes:
- 200: Success
- 202: Accepted (async operation)
- 400: Bad request (invalid params)
- 404: Session not found
- 500: Internal server error
