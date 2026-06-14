import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft, BarChart3, Eye } from "lucide-react";
import { Doughnut, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { mockSession, mockIssues } from "../data/mock";
import SummaryCards from "../components/SummaryCards";
import IssueTable from "../components/IssueTable";
import clsx from "clsx";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const reportFormats = [
  { key: "excel", label: "Excel" },
  { key: "html", label: "HTML Dashboard" },
  { key: "pdf", label: "PDF" },
  { key: "markdown", label: "Markdown" },
  { key: "json", label: "JSON" },
  { key: "csv", label: "CSV" },
];

export default function Results() {
  const { sessionId } = useParams();
  const s = mockSession;

  const byCategory = Object.entries(s.summary.by_category).map(([k, v]) => ({
    label: k.charAt(0).toUpperCase() + k.slice(1),
    pass: v.pass_pct,
    fail: 100 - v.pass_pct,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)]"><ArrowLeft size={18} /></Link>
          <div>
            <h2 className="text-2xl font-bold">Results</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">Session: {sessionId} · {new Date(s.completed_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="relative group">
          <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2">
            <Download size={16} /> Download Reports
          </button>
          <div className="absolute right-0 top-full mt-2 w-44 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            {reportFormats.map((f) => (
              <a key={f.key} href="#" className="block px-4 py-2.5 text-sm hover:bg-[var(--color-surface-alt)] first:rounded-t-xl last:rounded-b-xl">{f.label}</a>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <SummaryCards summary={s.summary} />

      {/* Verdict + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className={clsx("text-sm font-bold px-4 py-1.5 rounded-full mb-3", s.summary.verdict === "FAIL" ? "bg-red-50 text-red-600 dark:bg-red-900/20" : "bg-green-50 text-green-600")}>
            {s.summary.verdict}
          </div>
          <div className="w-28 h-28">
            <Doughnut data={{ labels: ["Pass", "Fail"], datasets: [{ data: [s.summary.pass_count, s.summary.fail_count], backgroundColor: ["#22c55e", "#ef4444"], borderWidth: 0 }] }} options={{ cutout: "70%", plugins: { tooltip: { enabled: false }, legend: { display: false } } }} />
          </div>
          <p className="text-3xl font-bold mt-2">{s.summary.pass_percentage}%</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{s.summary.pass_count} / {s.summary.total_checks} checks passed</p>
        </div>

        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Pass Rate by Category</h3>
          <div className="space-y-3">
            {byCategory.map((cat) => (
              <div key={cat.label}>
                <div className="flex justify-between text-sm mb-1"><span>{cat.label}</span><span className="font-semibold">{cat.pass.toFixed(1)}%</span></div>
                <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div className={clsx("h-full rounded-full transition-all", cat.pass >= 90 ? "bg-[var(--color-success)]" : cat.pass >= 80 ? "bg-[var(--color-warning)]" : "bg-[var(--color-error)]")} style={{ width: `${cat.pass}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(s.summary.by_severity).map(([sev, count]) => (
          <div key={sev} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className={clsx("text-2xl font-bold", sev === "critical" ? "text-red-500" : sev === "high" ? "text-orange-500" : sev === "medium" ? "text-yellow-500" : "text-blue-500")}>{count}</p>
            <p className="text-xs text-[var(--color-text-secondary)] capitalize">{sev}</p>
          </div>
        ))}
      </div>

      {/* Issues Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">All Issues</h3>
          <Link to={`/results/${sessionId}/element/hero-title`} className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"><Eye size={14} /> View Element Detail</Link>
        </div>
        <IssueTable issues={mockIssues} onRowClick={(issue) => window.location.href = `/results/${sessionId}/element/${issue.element.toLowerCase().replace(/\s+/g, "-")}`} />
      </div>
    </div>
  );
}
