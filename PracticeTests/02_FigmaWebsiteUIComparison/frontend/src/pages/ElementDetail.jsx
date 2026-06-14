import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { mockElementDetail } from "../data/mock";
import StatusBadge from "../components/StatusBadge";
import clsx from "clsx";

export default function ElementDetail() {
  const { sessionId, elementId } = useParams();
  const el = mockElementDetail;

  const PropertyRow = ({ label, figma, web, check }) => (
    <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/50">
      <td className="px-4 py-3 text-sm font-medium">{label}</td>
      <td className="px-4 py-3 text-sm">{figma}</td>
      <td className="px-4 py-3 text-sm">{web}</td>
      <td className="px-4 py-3"><StatusBadge status={check?.status} /></td>
      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{check?.tolerance || "-"}</td>
      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{check?.difference || "-"}</td>
      <td className="px-4 py-3">{check?.severity ? <StatusBadge severity={check.severity} /> : "-"}</td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <Link to={`/results/${sessionId}`} className="hover:text-[var(--color-text)]">Results</Link>
        <ChevronRight size={14} />
        <span className="text-[var(--color-text)] font-medium">{el.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/results/${sessionId}`} className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)]"><ArrowLeft size={18} /></Link>
        <div>
          <div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{el.name}</h2><StatusBadge status={el.checks.some((c) => c.status === "FAIL") ? "FAIL" : "PASS"} /></div>
          <p className="text-sm text-[var(--color-text-secondary)]">{el.type} · <code className="bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded">{el.tag}</code> · Session: {sessionId}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Figma Card */}
        <div className="lg:col-span-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3">🎨 Figma</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-[var(--color-text-secondary)]">Content:</span> <span className="font-medium">{el.figma.content}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Position:</span> ({el.figma.bounding_box.x}, {el.figma.bounding_box.y})</div>
            <div><span className="text-[var(--color-text-secondary)]">Size:</span> {el.figma.bounding_box.width} × {el.figma.bounding_box.height}</div>
            <div><span className="text-[var(--color-text-secondary)]">Breadcrumb:</span> <code className="text-xs">{el.figma.hierarchy.breadcrumb.join(" › ")}</code></div>
          </div>
        </div>
        {/* Web Card */}
        <div className="lg:col-span-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-info)] mb-3">🌐 Web</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-[var(--color-text-secondary)]">Content:</span> <span className="font-medium">{el.web.content}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Position:</span> ({el.web.bounding_box.x}, {el.web.bounding_box.y})</div>
            <div><span className="text-[var(--color-text-secondary)]">Size:</span> {el.web.bounding_box.width} × {el.web.bounding_box.height}</div>
            <div><span className="text-[var(--color-text-secondary)]">Breadcrumb:</span> <code className="text-xs">{el.web.hierarchy.breadcrumb.join(" › ")}</code></div>
          </div>
        </div>
        {/* AI Summary Card */}
        <div className="lg:col-span-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-warning)] mb-3">🤖 AI Analysis</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-[var(--color-text-secondary)]">Issues:</span> <span className="font-medium text-[var(--color-error)]">{el.checks.filter((c) => c.status === "FAIL").length} failures</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Description:</span> Element does not match design spec</div>
            <div><span className="text-[var(--color-text-secondary)]">Root Cause:</span> Responsive breakpoint override</div>
            <div><span className="text-[var(--color-text-secondary)]">Suggested Fix:</span> Add media query override</div>
          </div>
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
              {el.checks.map((c, i) => {
                const getVal = (side) => {
                  const map = {
                    "font-size": `font_size`,
                    "font-weight": `font_weight`,
                    "letter-spacing": `letter_spacing`,
                    "line-height": `line_height`,
                    "text-align": `text_align`,
                    "text-color": ["color", "color"],
                    "width": ["bounding_box", "width"],
                    "x-position": ["bounding_box", "x"],
                    "margin-bottom": ["margin", "bottom"],
                  };
                  return "-";
                };
                return (
                  <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/50">
                    <td className="px-4 py-3 font-medium">{c.property}</td>
                    <td className="px-4 py-3">{c.expected}</td>
                    <td className="px-4 py-3">{c.actual}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{c.tolerance}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{c.difference}</td>
                    <td className="px-4 py-3">{c.severity ? <StatusBadge severity={c.severity} /> : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
