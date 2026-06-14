// Mock data for UI development — will be replaced by API calls

export const mockSession = {
  id: "a1b2c3d4",
  status: "complete",
  created_at: "2026-06-14T14:30:00Z",
  completed_at: "2026-06-14T14:31:22Z",
  config: {
    figma_url: "https://www.figma.com/file/abc123/Landing-Page",
    web_url: "https://example.com/landing",
    viewports: ["Desktop 1920", "Laptop 1440"],
    categories: ["typography", "colors", "layout", "accessibility"],
  },
  summary: {
    total_elements: 142,
    total_checks: 1136,
    pass_count: 992,
    fail_count: 144,
    pass_percentage: 87.3,
    by_severity: { critical: 2, high: 18, medium: 45, low: 79 },
    by_category: {
      typography: { pass: 230, fail: 42, pass_pct: 84.6 },
      colors: { pass: 180, fail: 12, pass_pct: 93.3 },
      layout: { pass: 340, fail: 58, pass_pct: 85.4 },
      accessibility: { pass: 60, fail: 8, pass_pct: 88.2 },
      images: { pass: 42, fail: 4, pass_pct: 91.3 },
      components: { pass: 140, fail: 20, pass_pct: 87.5 },
    },
    verdict: "FAIL",
  },
};

export const mockIssues = [
  { id: 1, element: "Hero Title", property: "font-size", expected: "48px", actual: "32px", severity: "high", category: "typography", status: "FAIL", description: "Hero title is 32px instead of 48px", root_cause: "Media query override at 768px", suggested_fix: "Add min-width:992px override with font-size:48px" },
  { id: 2, element: "CTA Button", property: "background-color", expected: "#4F46E5", actual: "#6366F1", severity: "medium", category: "colors", status: "FAIL", description: "Button color slightly off", root_cause: "Wrong CSS variable mapped", suggested_fix: "Use --color-primary instead of --color-primary-light" },
  { id: 3, element: "Navbar Logo", property: "missing", expected: "Present", actual: "Not found", severity: "critical", category: "components", status: "FAIL", description: "Logo is missing from the page", root_cause: "Image path broken in production build", suggested_fix: "Update logo src to use absolute path" },
  { id: 4, element: "Footer Links", property: "font-family", expected: "Inter", actual: "Georgia", severity: "low", category: "typography", status: "FAIL", description: "Wrong font for footer links", root_cause: "Global font-family fallback applied", suggested_fix: "Add font-family: Inter to footer link styles" },
  { id: 5, element: "Hero Title", property: "line-height", expected: "56px", actual: "40px", severity: "medium", category: "typography", status: "FAIL", description: "Line height too tight", root_cause: "Mobile line-height overriding desktop", suggested_fix: "Use clamp() for line-height" },
];

export const mockHistory = [
  { id: "a1b2c3d4", date: "2026-06-14T14:30:00Z", project: "Landing Page v2", base_url: "figma.com/file/abc", compare_url: "example.com/landing", pass_rate: 87.3, trend: "decreasing", issue_count: 144 },
  { id: "e5f6g7h8", date: "2026-06-07T10:00:00Z", project: "Landing Page v2", base_url: "figma.com/file/abc", compare_url: "example.com/landing", pass_rate: 89.4, trend: "decreasing", issue_count: 118 },
  { id: "i9j0k1l2", date: "2026-06-01T09:15:00Z", project: "Landing Page v2", base_url: "figma.com/file/abc", compare_url: "example.com/landing", pass_rate: 92.1, trend: "stable", issue_count: 87 },
  { id: "m3n4o5p6", date: "2026-05-25T16:00:00Z", project: "Dashboard v1", base_url: "figma.com/file/def", compare_url: "app.example.com/dashboard", pass_rate: 95.0, trend: "increasing", issue_count: 52 },
  { id: "q7r8s9t0", date: "2026-05-18T11:30:00Z", project: "Dashboard v1", base_url: "figma.com/file/def", compare_url: "app.example.com/dashboard", pass_rate: 91.2, trend: "increasing", issue_count: 78 },
];

export const mockElementDetail = {
  id: "hero-title",
  name: "Hero Title",
  type: "text",
  tag: "h1",
  figma: {
    bounding_box: { x: 100, y: 200, width: 600, height: 48 },
    styles: { typography: { font_family: "Inter", font_size: 48, font_weight: 700, letter_spacing: -0.5, line_height: 56, text_align: "center" }, colors: { color: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 }, background_color: null }, layout: { margin: { top: 0, right: 0, bottom: 16, left: 0 }, padding: { top: 0, right: 0, bottom: 0, left: 0 }, border_radius: 0, display: "block" } },
    content: "Welcome to Our Platform",
    hierarchy: { breadcrumb: ["root", "header", "hero-title"], depth: 2 },
  },
  web: {
    bounding_box: { x: 24, y: 180, width: 327, height: 36 },
    styles: { typography: { font_family: "Inter", font_size: 32, font_weight: 700, letter_spacing: 0, line_height: 40, text_align: "left" }, colors: { color: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 }, background_color: null }, layout: { margin: { top: 0, right: 0, bottom: 12, left: 0 }, padding: { top: 0, right: 0, bottom: 0, left: 0 }, border_radius: 0, display: "block" } },
    content: "Welcome to Our Platform",
    hierarchy: { breadcrumb: ["root", "div#app", "header", "h1"], depth: 3 },
  },
  checks: [
    { category: "typography", property: "font-size", expected: "48px", actual: "32px", status: "FAIL", severity: "high", tolerance: "±1px", difference: "-16px", },
    { category: "typography", property: "font-weight", expected: "700", actual: "700", status: "PASS", severity: null, tolerance: "±100", difference: "0", },
    { category: "typography", property: "letter-spacing", expected: "-0.5px", actual: "0px", status: "FAIL", severity: "low", tolerance: "±0.5px", difference: "+0.5px", },
    { category: "typography", property: "line-height", expected: "56px", actual: "40px", status: "FAIL", severity: "medium", tolerance: "±2px", difference: "-16px", },
    { category: "typography", property: "text-align", expected: "center", actual: "left", status: "FAIL", severity: "medium", tolerance: "exact", difference: "misaligned", },
    { category: "colors", property: "text-color", expected: "rgba(26,26,46,1)", actual: "rgba(26,26,46,1)", status: "PASS", severity: null, tolerance: "ΔE≤2", difference: "0", },
    { category: "layout", property: "width", expected: "600px", actual: "327px", status: "FAIL", severity: "high", tolerance: "±2px", difference: "-273px", },
    { category: "layout", property: "x-position", expected: "100px", actual: "24px", status: "FAIL", severity: "medium", tolerance: "±2px", difference: "-76px", },
    { category: "layout", property: "margin-bottom", expected: "16px", actual: "12px", status: "FAIL", severity: "low", tolerance: "±2px", difference: "-4px", },
  ],
};
