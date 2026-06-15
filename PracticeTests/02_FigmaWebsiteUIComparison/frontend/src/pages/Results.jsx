import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft, Eye, Loader2 } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { api } from "../services/api";
import SummaryCards from "../components/SummaryCards";
import IssueTable from "../components/IssueTable";
import clsx from "clsx";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const reportFormats = [
  { key: "excel", label: "Excel (.xlsx)" },
  { key: "html", label: "HTML Dashboard" },
  { key: "json", label: "JSON" },
];

export default function Results() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let attempts = 0;
    const fetchResults = async () => {
      try {
        const res = await api.getResults(sessionId);
        if (res.status === "pending" || res.status === "extracting" || res.status === "matching" || res.status === "comparing" || res.status === "analyzing" || res.status === "reporting") {
          if (attempts < 10) {
            attempts++;
            setTimeout(fetchResults, 2000);
          } else {
            setError("Results are taking longer than expected. Please check back later.");
            setLoading(false);
          }
          return;
        }
        setData(res);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId]);

  const handleDownload = async (format) => {
    try {
      const blob = await api.downloadReport(sessionId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${sessionId.slice(0, 8)}.${format === "excel" ? "xlsx" : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-3">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-[var(--color-error)] font-medium">{error}</p>
        <Link to="/" className="inline-block mt-4 text-[var(--color-primary)] hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const summary = data?.summary || {};
  const elements = data?.elements || [];

  const byCategory = Object.entries(summary.by_category || {}).map(([k, v]) => ({
    label: k.charAt(0).toUpperCase() + k.slice(1),
    pass: v.pass_pct,
  }));

  const issues = elements.flatMap((el) =>
    (el.checks || []).map((check, i) => ({
      id: i + 1,
      element: el.figma_element?.name || el.figma_id,
      property: check.property,
      expected: String(check.expected ?? ""),
      actual: String(check.actual ?? ""),
      status: check.status,
      severity: check.severity,
      category: check.category,
    }))
  ).filter((i) => i.status === "FAIL");

  const elementNavMap = {};
  elements.forEach((el) => {
    const name = el.figma_element?.name || el.figma_id;
    elementNavMap[name] = el.figma_id;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)]"><ArrowLeft size={18} /></Link>
          <div>
            <h2 className="text-2xl font-bold">Results</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">Session: {sessionId}</p>
          </div>
        </div>
        <div className="relative group">
          <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2">
            <Download size={16} /> Download Reports
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            {reportFormats.map((f) => (
              <button key={f.key} onClick={() => handleDownload(f.key)}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-surface-alt)] first:rounded-t-xl last:rounded-b-xl">{f.label}</button>
            ))}
          </div>
        </div>
      </div>

      <SummaryCards summary={{
        total_checks: summary.total_checks || 0,
        pass_count: summary.pass_count || 0,
        fail_count: summary.fail_count || 0,
        pass_percentage: summary.pass_percentage || 0,
      }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className={clsx("text-sm font-bold px-4 py-1.5 rounded-full mb-3",
            (summary.verdict || "").startsWith("FAIL") ? "bg-red-50 text-red-600 dark:bg-red-900/20" :
            (summary.verdict || "").startsWith("WARN") ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20" :
            "bg-green-50 text-green-600 dark:bg-green-900/20"
          )}>
            {summary.verdict || "UNKNOWN"}
          </div>
          <div className="w-28 h-28">
            <canvas id="doughnut" width="112" height="112"
              style={{ borderRadius: "50%", background: `conic-gradient(#22c55e ${(summary.pass_percentage || 0) * 3.6}deg, #ef4444 0deg)` }} />
          </div>
          <p className="text-3xl font-bold mt-2">{summary.pass_percentage || 0}%</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{summary.pass_count || 0} / {summary.total_checks || 0} checks passed</p>
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

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(summary.by_severity || {}).map(([sev, count]) => (
          <div key={sev} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className={clsx("text-2xl font-bold", sev === "critical" ? "text-red-500" : sev === "high" ? "text-orange-500" : sev === "medium" ? "text-yellow-500" : "text-blue-500")}>{count}</p>
            <p className="text-xs text-[var(--color-text-secondary)] capitalize">{sev}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">All Issues</h3>
        </div>
        <IssueTable issues={issues} onRowClick={(issue) => {
          const id = elementNavMap[issue.element] || issue.element;
          window.location.href = `/results/${sessionId}/element/${encodeURIComponent(id)}`;
        }} />
      </div>
    </div>
  );
}
