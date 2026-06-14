# Extraction SOP — Figma & Web

## FigmaExtractor

### Input
- `figma_url: str` — e.g. `https://www.figma.com/file/abc123/MyDesign`
- `token: str` — Figma Personal Access Token
- `config: AppConfig`

### Process
1. Parse file key from URL via regex: `/file/([a-zA-Z0-9]+)/`
2. Call `GET https://api.figma.com/v1/files/{key}` with `X-Figma-Token` header
3. Recursively walk the `document.children` tree
4. For each node, extract:
   - `id`, `name`, `type` (TEXT, RECTANGLE, FRAME, COMPONENT, INSTANCE, GROUP, VECTOR)
   - `absoluteBoundingBox` → `bounding_box`
   - `style` → typography (fontFamily, fontSize, fontWeight, letterSpacing, lineHeightPx)
   - `fills` → colors (RGBA 0-1 normalized → 0-255)
   - `strokes` → border colors
   - `characters` → text content
   - `effects` → shadows (type, offset, radius, color)
   - `opacity`
   - Auto-layout: `layoutMode`, `primaryAxisAlignItems`, `counterAxisAlignItems`, `padding*`, `itemSpacing`
5. Normalize to `NormalizedElement` schema
6. Build breadcrumb hierarchy by tracking parent chain

### Type Mapping
| Figma Type | Normalized Type |
|------------|----------------|
| TEXT | text |
| RECTANGLE | rectangle |
| FRAME | frame |
| COMPONENT / INSTANCE | component (subtype: button, card, input, etc.) |
| GROUP | group |
| VECTOR / LINE | vector |
| ELLIPSE | ellipse |

### Mock Mode (when token is empty or API returns 403)
Generate 18 realistic elements:
- 1 Heading (h1) — "Welcome to Our Platform"
- 1 Subheading (h2) — "Your journey starts here"
- 1 Paragraph — lorem ipsum body text
- 2 Buttons (primary + secondary) — "Get Started", "Learn More"
- 1 Navigation bar (nav) with 4 links
- 1 Hero Image placeholder
- 3 Feature Cards (icon, title, description)
- 1 Footer with 3 columns (links, social, copyright)
- 1 Form with 2 inputs (email + submit button)
- 1 Logo image
- 1 Testimonial quote
- 1 Divider line

Each mock element has realistic bounding boxes, computed styles, and hierarchy.

### Error Handling
- Invalid/malformed URL → return empty list, log error
- 403 Forbidden → fall back to mock mode, log warning
- 429 Rate Limited → wait 30s retry once, then fall back to mock
- Network timeout → retry once, then fall back to mock
- Partial data → extract what's available, log warnings for malformed nodes

---

## WebExtractor

### Input
- `url: str` — target website URL
- `viewports: list[ViewportPreset]` — only enabled viewports
- `config: AppConfig`

### Process
For each enabled viewport:

1. Launch Chromium headless via Playwright
2. Set viewport dimensions
3. Navigate to URL, wait for `networkidle`
4. Extract all visible elements via `document.body.querySelectorAll('*')`:
   - Filter: `el.offsetParent !== null` (visible in DOM)
   - Filter: `rect.width > 0 && rect.height > 0` (non-zero size)
   - For each visible element:
     - `tagName` (lowercase)
     - `id`, `className`
     - `getBoundingClientRect()` → `x, y, width, height`
     - `getComputedStyle(el)` → all CSS properties (font*, color*, background*, margin*, padding*, border*, display, opacity, etc.)
     - `innerText` (truncated to 500 chars)
     - ARIA: `getAttribute('role')`, `getAttribute('aria-label')`, `getAttribute('aria-labelledby')`
     - `alt`, `href`, `src` attributes
     - `tabIndex`
     - Breadcrumb: walk `el.parentElement` chain up to 5 levels, collect tag + class
5. Take full-page screenshot (scroll + stitch if content > viewport)
6. Save screenshot to `.tmp/sessions/{id}/screenshots/{viewport}.png`

### Style Properties Extracted
```
fontFamily, fontSize, fontWeight, lineHeight, letterSpacing,
textAlign, textTransform, textDecoration, color, backgroundColor,
borderColor, borderWidth, borderRadius, borderStyle,
marginTop, marginRight, marginBottom, marginLeft,
paddingTop, paddingRight, paddingBottom, paddingLeft,
display, opacity, visibility, overflow, zIndex,
boxShadow, flexDirection, justifyContent, alignItems,
gridTemplate, gap, transform, transition, cursor
```

### Viewport Presets
| Name | Width | Height |
|------|-------|--------|
| Desktop | 1920 | 1080 |
| Laptop | 1440 | 900 |
| Tablet | 768 | 1024 |
| Mobile | 375 | 667 |

### Error Handling
- Invalid URL → raise ValueError
- Navigation timeout → log error, try with `domcontentloaded` fallback
- Element extraction JS error → retry extraction block once, skip if fails
- Screenshot failure → log warning, continue without screenshot
- Per-viewport errors are isolated — one viewport failing doesn't block others
