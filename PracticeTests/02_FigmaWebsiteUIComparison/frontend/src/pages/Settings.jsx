import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    tolerances: { position: 2, size: 2, colorDelta: 2.0, fontSize: 1, fontWeight: 100, opacity: 0.05, borderRadius: 1, lineHeight: 2 },
    defaults: { ignoreDynamic: true, aiEnabled: false, itemsPerPage: 25 },
    viewports: [
      { name: "Desktop", width: 1920, height: 1080, enabled: true },
      { name: "Laptop", width: 1440, height: 900, enabled: true },
      { name: "Tablet", width: 768, height: 1024, enabled: false },
      { name: "Mobile", width: 375, height: 667, enabled: false },
    ],
  });

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Theme */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Theme</h3>
        <div className="flex gap-3">
          {[
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
            { id: "system", label: "System" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className={clsx("px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors", theme === t.id ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)]")}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tolerances */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Default Tolerances</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(settings.tolerances).map(([key, val]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1 capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
              <input type="number" step="0.1" min="0" max="50" value={val}
                onChange={(e) => setSettings((s) => ({ ...s, tolerances: { ...s.tolerances, [key]: parseFloat(e.target.value) } }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Default Viewports */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Default Viewports</h3>
        <div className="space-y-3">
          {settings.viewports.map((vp, i) => (
            <div key={vp.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-alt)]">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={vp.enabled} onChange={() => setSettings((s) => {
                  const vps = [...s.viewports];
                  vps[i] = { ...vps[i], enabled: !vps[i].enabled };
                  return { ...s, viewports: vps };
                })} className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30" />
                <div><p className="font-medium text-sm">{vp.name}</p><p className="text-xs text-[var(--color-text-secondary)]">{vp.width} × {vp.height}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">AI Analysis</h3>
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-sm font-medium">Enable AI Analysis</p><p className="text-xs text-[var(--color-text-secondary)]">Generate root cause explanations for failures</p></div>
          <button onClick={() => setSettings((s) => ({ ...s, defaults: { ...s.defaults, aiEnabled: !s.defaults.aiEnabled } }))}
            className={clsx("relative w-11 h-6 rounded-full transition-colors", settings.defaults.aiEnabled ? "bg-[var(--color-primary)]" : "bg-gray-300 dark:bg-gray-600")}>
            <div className={clsx("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform", settings.defaults.aiEnabled && "translate-x-5")} />
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Provider</label>
          <select className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30">
            <option>OpenAI</option>
            <option>Ollama (Local)</option>
          </select>
        </div>
      </div>

      {/* Storage */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Storage</h3>
        <div className="flex items-center justify-between text-sm">
          <div><p className="font-medium">Cache Size</p><p className="text-xs text-[var(--color-text-secondary)]">12.4 MB of temporary files</p></div>
          <button className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-surface-alt)] transition-colors flex items-center gap-2"><Trash2 size={14} /> Clear Cache</button>
        </div>
      </div>

      {/* Save */}
      <button onClick={save} className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center justify-center gap-2">
        <Save size={16} /> {saved ? "Settings Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
