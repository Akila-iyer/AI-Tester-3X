import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingDown, TrendingUp, Minus, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler } from "chart.js";
import { api } from "../services/api";
import clsx from "clsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

function extractProjectName(url) {
  if (!url) return "Unnamed";
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[parts.length - 1]?.replace(/[-_]/g, " ") || "Unnamed";
  } catch {
    return "Unnamed";
  }
}

function computeTrend(runs, idx) {
  if (idx <= 0) return "stable";
  const curr = runs[idx].pass_rate;
  const prev = runs[idx - 1].pass_rate;
  if (curr > prev + 1) return "increasing";
  if (curr < prev - 1) return "decreasing";
  return "stable";
}

const trendIcon = (t) =>
  t === "increasing" ? <TrendingUp size={16} className="text-[var(--color-success)]" /> :
  t === "decreasing" ? <TrendingDown size={16} className="text-[var(--color-error)]" /> :
  <Minus size={16} className="text-[var(--color-text-secondary)]" />;

export default function History() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    api.getHistory(100).then((data) => {
      const mapped = (data.runs || []).map((r, i, arr) => ({
        id: r.id,
        date: r.date || "",
        project: extractProjectName(r.figma_url),
        compare_url: r.web_url || "",
        pass_rate: r.pass_rate || 0,
        issue_count: "-",
        trend: computeTrend(arr, i),
      }));
      setRuns(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = runs
    .filter((h) => h.project.toLowerCase().includes(search.toLowerCase()) || h.compare_url.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = sortField === "date" ? new Date(a.date) - new Date(b.date) :
                sortField === "pass_rate" ? a.pass_rate - b.pass_rate :
                a.project.localeCompare(b.project);
      return sortAsc ? cmp : -cmp;
    });

  const trendData = runs.length > 0 ? {
    labels: runs.slice().reverse().map((h) => h.date.slice(0, 10)),
    datasets: [{
      label: "Pass Rate %",
      data: runs.slice().reverse().map((h) => h.pass_rate),
      borderColor: "#4f46e5",
      backgroundColor: "rgba(79,70,229,0.1)",
      fill: true, tension: 0.3, pointBackgroundColor: "#4f46e5",
    }],
  } : null;

  const toggleSort = (field) => { if (sortField === field) setSortAsc(!sortAsc); else { setSortField(field); setSortAsc(false); } };
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">History</h2>

      {trendData && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Pass Rate Trend</h3>
          <Line data={trendData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10 } } }, y: { min: 0, max: 100, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } } } }} height={120} />
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input type="text" placeholder="Search by project or URL..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
                {["Date", "Project", "Compare URL", "Pass Rate", "Trend", ""].map((h) => (
                  <th key={h} className={clsx("px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider", h !== "" && "cursor-pointer select-none")}
                    onClick={() => h !== "" && toggleSort(h === "Compare URL" ? "compare_url" : h.toLowerCase().replace(" ", "_"))}>
                    <div className="flex items-center gap-1">{h} {h !== "" && <SortIcon field={h === "Compare URL" ? "compare_url" : h.toLowerCase().replace(" ", "_")} />}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-[var(--color-text-secondary)]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-[var(--color-text-secondary)]">No runs found.</td></tr>
              ) : filtered.map((run) => (
                <tr key={run.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/50">
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{run.date ? new Date(run.date).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3 font-medium">{run.project}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{run.compare_url}</td>
                  <td className={clsx("px-4 py-3 font-bold", run.pass_rate >= 90 ? "text-[var(--color-success)]" : run.pass_rate >= 80 ? "text-[var(--color-warning)]" : "text-[var(--color-error)]")}>{run.pass_rate}%</td>
                  <td className="px-4 py-3">{trendIcon(run.trend)}</td>
                  <td className="px-4 py-3"><Link to={`/results/${run.id}`} className="text-[var(--color-primary)] hover:underline text-xs font-medium">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
