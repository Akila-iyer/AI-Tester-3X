import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import clsx from "clsx";

export default function ScreenshotViewer() {
  const { sessionId } = useParams();
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState("side-by-side"); // side-by-side | overlay | diff

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/results/${sessionId}`} className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)]"><ArrowLeft size={18} /></Link>
          <div>
            <h2 className="text-2xl font-bold">Screenshot Viewer</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">Session: {sessionId} · Desktop 1920×1080</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--color-surface-alt)] rounded-xl p-1 border border-[var(--color-border)]">
            {["side-by-side", "overlay", "diff"].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors", mode === m ? "bg-[var(--color-surface)] shadow-sm" : "text-[var(--color-text-secondary)]")}>{m.replace("-", " ")}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-[var(--color-surface-alt)] rounded-xl p-1 border border-[var(--color-border)]">
            <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="p-1.5 rounded-lg hover:bg-[var(--color-surface)]"><ZoomOut size={16} /></button>
            <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="p-1.5 rounded-lg hover:bg-[var(--color-surface)]"><ZoomIn size={16} /></button>
          </div>
        </div>
      </div>

      {/* Screenshot Display */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="p-2 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className={clsx("w-3 h-3 rounded-full", mode === "side-by-side" ? "bg-[var(--color-primary)]" : mode === "overlay" ? "bg-[var(--color-warning)]" : "bg-[var(--color-error)]")} />
          {mode === "side-by-side" ? "Side by Side" : mode === "overlay" ? "Overlay (50% opacity)" : "Diff Highlight"}
        </div>
        <div className="overflow-auto p-4 flex items-start justify-center" style={{ maxHeight: "70vh" }}>
          {mode === "side-by-side" ? (
            <div className="flex gap-4" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <div className="bg-[var(--color-primary)]/10 text-xs text-center py-1 font-medium text-[var(--color-primary)]">Figma</div>
                <div className="w-[480px] h-[600px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[var(--color-text-secondary)] text-sm">Figma Screenshot Placeholder</div>
              </div>
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <div className="bg-[var(--color-info)]/10 text-xs text-center py-1 font-medium text-[var(--color-info)]">Web</div>
                <div className="w-[480px] h-[600px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[var(--color-text-secondary)] text-sm">Web Screenshot Placeholder</div>
              </div>
            </div>
          ) : mode === "overlay" ? (
            <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <div className="w-[480px] h-[600px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[var(--color-text-secondary)] text-sm">Web Screenshot (Base)</div>
              <div className="absolute inset-0 opacity-50" style={{ mixBlendMode: "difference" }}>
                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[var(--color-text-secondary)] text-sm">Figma Overlay</div>
              </div>
            </div>
          ) : (
            <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <div className="w-[480px] h-[600px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[var(--color-text-secondary)] text-sm">Diff — Red = Changed</div>
              {/* Diff hotspots */}
              <div className="absolute top-[120px] left-[50px] w-[200px] h-[40px] border-2 border-red-500 rounded-lg bg-red-500/10 animate-pulse cursor-pointer" title="Hero Title — font-size mismatch" />
              <div className="absolute top-[300px] left-[150px] w-[120px] h-[48px] border-2 border-orange-500 rounded-lg bg-orange-500/10 animate-pulse cursor-pointer" title="CTA Button — color mismatch" />
              <div className="absolute top-[500px] left-[20px] w-[60px] h-[60px] border-2 border-red-500 rounded-lg bg-red-500/10 animate-pulse cursor-pointer" title="Navbar Logo — missing element" />
            </div>
          )}
        </div>
      </div>

      {/* Hotspot Legend */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Diff Hotspots</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-red-500 bg-red-500/20" /> Hero Title — font-size mismatch</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-orange-500 bg-orange-500/20" /> CTA Button — color mismatch</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-red-500 bg-red-500/20" /> Navbar Logo — missing element</div>
        </div>
      </div>
    </div>
  );
}
