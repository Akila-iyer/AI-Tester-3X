import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "../services/api";
import StatusBadge from "../components/StatusBadge";

export default function ElementDetail() {
  const { sessionId, elementId } = useParams();
  const [el, setEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await api.getElementDetail(sessionId, elementId);
        setEl(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [sessionId, elementId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (error || !el) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-[var(--color-error)] font-medium">{error || "Element not found"}</p>
        <Link to={`/results/${sessionId}`} className="inline-block mt-4 text-[var(--color-primary)] hover:underline">Back to Results</Link>
      </div>
    );
  }

  const figma = el.figma || {};
  const web = el.web || {};
  const checks = el.checks || [];
  const aiExpl = el.ai_explanation || [];
  const failCount = checks.filter((c) => c.status === "FAIL").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <Link to={`/results/${sessionId}`} className="hover:text-[var(--color-text)]">Results</Link>
        <ChevronRight size={14} />
        <span className="text-[var(--color-text)] font-medium">{figma.name || elementId}</span>
      </div>

      <div className="flex items-center gap-4">
        <Link to={`/results/${sessionId}`} className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)]"><ArrowLeft size={18} /></Link>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{figma.name || elementId}</h2>
            <StatusBadge status={failCount > 0 ? "FAIL" : "PASS"} />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">{figma.type || "?"} · <code className="bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded">{figma.tag || "?"}</code> · Session: {sessionId}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3">Figma</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-[var(--color-text-secondary)]">Content:</span> <span className="font-medium">{(figma.content || "") || "-"}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Position:</span> ({figma.bounding_box?.x || "?"}, {figma.bounding_box?.y || "?"})</div>
            <div><span className="text-[var(--color-text-secondary)]">Size:</span> {figma.bounding_box?.width || "?"} x {figma.bounding_box?.height || "?"}</div>
            <div><span className="text-[var(--color-text-secondary)]">Breadcrumb:</span> <code className="text-xs">{(figma.hierarchy?.breadcrumb || []).join(" > ")}</code></div>
          </div>
        </div>
        <div className="lg:col-span-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-blue-500 mb-3">Web</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-[var(--color-text-secondary)]">Content:</span> <span className="font-medium">{(web.content || "") || "-"}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Position:</span> ({web.bounding_box?.x || "?"}, {web.bounding_box?.y || "?"})</div>
            <div><span className="text-[var(--color-text-secondary)]">Size:</span> {web.bounding_box?.width || "?"} x {web.bounding_box?.height || "?"}</div>
            <div><span className="text-[var(--color-text-secondary)]">Breadcrumb:</span> <code className="text-xs">{(web.hierarchy?.breadcrumb || []).join(" > ")}</code></div>
          </div>
        </div>
        <div className="lg:col-span-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-yellow-500 mb-3">AI Analysis</h3>
          {aiExpl.length > 0 ? (
            <div className="space-y-2 text-sm">
              {aiExpl.map((a, i) => (
                <div key={i}>
                  <div><span className="text-[var(--color-text-secondary)]">Issue:</span> {a.property}</div>
                  <div><span className="text-[var(--color-text-secondary)]">Root Cause:</span> {a.root_cause}</div>
                  <div><span className="text-[var(--color-text-secondary)]">Suggested Fix:</span> {a.suggested_fix}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div><span className="text-[var(--color-text-secondary)]">Issues:</span> <span className="font-medium text-[var(--color-error)]">{failCount} failures</span></div>
              <p className="text-xs text-[var(--color-text-secondary)]">AI analysis not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Comparison Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold">All Properties</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-alt)]">
                {["Property", "Expected (Figma)", "Actual (Web)", "Status", "Tolerance", "Difference", "Severity"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {checks.map((c, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/50">
                  <td className="px-4 py-3 font-medium">{c.property}</td>
                  <td className="px-4 py-3">{String(c.expected ?? "-")}</td>
                  <td className="px-4 py-3">{String(c.actual ?? "-")}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{c.tolerance || "-"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{c.difference != null ? c.difference : "-"}</td>
                  <td className="px-4 py-3">{c.severity ? <StatusBadge severity={c.severity} /> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
