import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { api } from "../services/api";

const viewportPresets = [
  { name: "Desktop", width: 1920, height: 1080 },
  { name: "Laptop", width: 1440, height: 900 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Mobile", width: 375, height: 667 },
];

const categories = [
  { id: "typography", label: "Typography" },
  { id: "colors", label: "Colors" },
  { id: "layout", label: "Layout" },
  { id: "accessibility", label: "Accessibility" },
  { id: "images", label: "Images" },
  { id: "components", label: "Components" },
];

export default function NewComparison() {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    figmaUrl: "",
    webUrl: "",
    figmaToken: "",
    viewports: ["Desktop"],
    categories: ["typography", "colors", "layout", "accessibility", "images", "components"],
    tolerances: { position: 2, size: 2, color: 2.0, fontSize: 1 },
    aiAnalysis: false,
    ignoreDynamic: true,
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleArr = (field, item) => setForm((f) => ({ ...f, [field]: f[field].includes(item) ? f[field].filter((x) => x !== item) : [...f[field], item] }));
  const updateTol = (key, val) => setForm((f) => ({ ...f, tolerances: { ...f.tolerances, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const vps = form.viewports
      .map((v) => viewportPresets.find((p) => p.name === v))
      .filter(Boolean);

    const payload = {
      figma_url: form.figmaUrl,
      web_url: form.webUrl,
      figma_token: form.figmaToken,
      viewports: vps,
      categories: form.categories,
      ai_enabled: form.aiAnalysis,
      tolerance: form.tolerances,
    };

    try {
      const data = await api.createComparison(payload);
      navigate(`/progress/${data.session_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">New Comparison</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">Compare a Figma design against a live webpage</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Source Files</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Figma File URL</label>
            <input type="url" placeholder="https://www.figma.com/file/abc123/..." value={form.figmaUrl} onChange={(e) => update("figmaUrl", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Webpage URL</label>
            <input type="url" placeholder="https://example.com/page" value={form.webUrl} onChange={(e) => update("webUrl", e.target.value)} required className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Figma Access Token</label>
            <div className="relative">
              <input type="password" placeholder="figd_xxxxxxxxxxxx (leave empty for mock mode)" value={form.figmaToken} onChange={(e) => update("figmaToken", e.target.value)} className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </div>
          </div>
        </div>

        {/* Viewports */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Viewports</h3>
          <div className="flex flex-wrap gap-2">
            {viewportPresets.map((vp) => (
              <button key={vp.name} type="button" onClick={() => toggleArr("viewports", vp.name)}
                className={clsx("px-4 py-2 rounded-xl text-sm font-medium border transition-colors", form.viewports.includes(vp.name)
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)]"
                )}>{vp.name} <span className="opacity-60">{vp.width}x{vp.height}</span></button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Comparison Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat.id} type="button" onClick={() => toggleArr("categories", cat.id)}
                className={clsx("px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                  form.categories.includes(cat.id) ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)]"
                )}>{cat.label}</button>
            ))}
          </div>
        </div>

        {/* AI Toggle */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">AI Analysis</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Generate AI-powered explanations for each failure</p>
            </div>
            <button type="button" onClick={() => update("aiAnalysis", !form.aiAnalysis)}
              className={clsx("relative w-11 h-6 rounded-full transition-colors", form.aiAnalysis ? "bg-[var(--color-primary)]" : "bg-gray-300 dark:bg-gray-600")}>
              <div className={clsx("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform", form.aiAnalysis && "translate-x-5")} />
            </button>
          </div>
        </div>

        {/* Advanced */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium">
            Advanced Settings {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showAdvanced && (
            <div className="px-6 pb-6 space-y-4 border-t border-[var(--color-border)] pt-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(form.tolerances).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1 capitalize">{key.replace(/([A-Z])/g, " $1")} Tolerance</label>
                    <input type="number" step="0.1" min="0" max="50" value={val} onChange={(e) => updateTol(key, parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-sm" />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={form.ignoreDynamic} onChange={(e) => update("ignoreDynamic", e.target.checked)} className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30" />
                Ignore dynamic text content
              </label>
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center justify-center gap-2 text-base disabled:opacity-50">
          <Play size={18} /> {submitting ? "Starting..." : "Start Comparison"}
        </button>
      </form>
    </div>
  );
}
