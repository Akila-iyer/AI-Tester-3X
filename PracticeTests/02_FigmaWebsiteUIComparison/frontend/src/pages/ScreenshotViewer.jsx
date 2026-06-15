import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import clsx from "clsx";
import { api } from "../services/api";

export default function ScreenshotViewer() {
  const { sessionId } = useParams();
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState("side-by-side");
  const [screenshots, setScreenshots] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.getScreenshots(sessionId);
        setScreenshots(data || {});
      } catch (e) {
        // Screenshots may not exist — keep empty
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  const webSrc = screenshots.web_desktop || null;
  const figmaSrc = screenshots.figma_desktop || null;
  const diffSrc = screenshots.diff_desktop || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/results/${sessionId}`} className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)]"><ArrowLeft size={18} /></Link>
          <div>
            <h2 className="text-2xl font-bold">Screenshot Viewer</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">Session: {sessionId} · Desktop 1920x1080</p>
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

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="p-2 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className={clsx("w-3 h-3 rounded-full", mode === "side-by-side" ? "bg-[var(--color-primary)]" : mode === "overlay" ? "bg-[var(--color-warning)]" : "bg-[var(--color-error)]")} />
          {mode === "side-by-side" ? "Side by Side" : mode === "overlay" ? "Overlay (50% opacity)" : "Diff Highlight"}
        </div>
        <div className="overflow-auto p-4 flex items-start justify-center" style={{ maxHeight: "70vh" }}>
          {loading ? (
            <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
          ) : mode === "side-by-side" ? (
            <div className="flex gap-4" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <div className="bg-[var(--color-primary)]/10 text-xs text-center py-1 font-medium text-[var(--color-primary)]">Figma</div>
                {figmaSrc ? <img src={figmaSrc} alt="Figma" className="max-w-[480px]" /> : <div className="w-[480px] h-[300px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">No Figma screenshot</div>}
              </div>
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <div className="bg-blue-500/10 text-xs text-center py-1 font-medium text-blue-500">Web</div>
                {webSrc ? <img src={webSrc} alt="Web" className="max-w-[480px]" /> : <div className="w-[480px] h-[300px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">No web screenshot</div>}
              </div>
            </div>
          ) : mode === "overlay" && webSrc ? (
            <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <img src={webSrc} alt="Web" className="max-w-[480px]" />
              {figmaSrc && <img src={figmaSrc} alt="Figma overlay" className="absolute inset-0 opacity-40 max-w-[480px]" style={{ mixBlendMode: "difference" }} />}
            </div>
          ) : diffSrc ? (
            <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <img src={diffSrc} alt="Diff" className="max-w-[700px]" />
            </div>
          ) : (
            <div className="w-[480px] h-[300px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">No screenshots available</div>
          )}
        </div>
      </div>
    </div>
  );
}
