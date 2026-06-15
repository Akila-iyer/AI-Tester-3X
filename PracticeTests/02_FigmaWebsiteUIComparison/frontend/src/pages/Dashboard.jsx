import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Clock, TrendingDown, ArrowRight } from "lucide-react";
import { Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from "chart.js";
import { api } from "../services/api";
import clsx from "clsx";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

function extractProject(url) {
  if (!url) return "Unnamed";
  try { return new URL(url).pathname.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || "Unnamed"; }
  catch { return "Unnamed"; }
}

export default function Dashboard() {
  const [runs, setRuns] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const hist = await api.getHistory(10);
        const mapped = (hist.runs || []).map((r) => ({
          id: r.id, date: r.date, project: extractProject(r.figma_url),
          compare_url: r.web_url || "", pass_rate: r.pass_rate || 0,
        }));
        setRuns(mapped);

        if (mapped.length > 0) {
          const res = await api.getResults(mapped[0].id);
          setLatestResult(res.summary || {});
        }
      } catch (e) {
        // History may be empty — show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const recent = runs.slice(0, 3);
  const summary = latestResult || {};
  const passCount = summary.pass_count || 0;
  const failCount = summary.fail_count || 0;
  const totalChecks = summary.total_checks || 0;
  const passPct = summary.pass_percentage || 0;

  const doughnutData = runs.length > 0 ? {
    labels: ["Pass", "Fail"],
    datasets: [{ data: [passCount, failCount], backgroundColor: ["#22c55e", "#ef4444"], borderWidth: 0 }],
  } : null;

  const lineData = runs.length > 1 ? {
    labels: runs.slice().reverse().map((h) => h.date?.slice(0, 10) || ""),
    datasets: [{
      label: "Pass Rate %",
      data: runs.slice().reverse().map((h) => h.pass_rate),
      borderColor: "#4f46e5",
      backgroundColor: "rgba(79,70,229,0.1)",
      fill: true, tension: 0.3, pointBackgroundColor: "#4f46e5",
    }],
  } : null;

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10 } } }, y: { min: 0, max: 100, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } } },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Welcome to Visual UI Testing Platform</p>
        </div>
        <Link to="/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">
          <PlusCircle size={18} /> New Comparison
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading dashboard...</div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <p className="text-lg font-medium mb-2">No comparisons yet</p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">Run your first visual comparison to see data here.</p>
          <Link to="/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold">Start Your First Comparison</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Pass Rate Trend</h3>
              {lineData ? <Line data={lineData} options={lineOptions} height={200} /> : <p className="text-sm text-[var(--color-text-secondary)]">Need at least 2 runs for a trend chart.</p>}
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center justify-center">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Latest Run</h3>
              <div className="w-32 h-32">
                {doughnutData ? (
                  <Doughnut data={doughnutData} options={{ cutout: "75%", plugins: { tooltip: { enabled: false }, legend: { display: false } } }} />
                ) : (
                  <div className="w-full h-full rounded-full bg-[var(--color-border)]" />
                )}
              </div>
              <p className="text-2xl font-bold mt-2">{passPct}%</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{passCount} / {totalChecks} passed</p>
              {runs.length >= 2 && runs[0].pass_rate < runs[1].pass_rate && (
                <div className="flex items-center gap-1 mt-2 text-xs text-[var(--color-error)]"><TrendingDown size={14} /> Down {Math.round(runs[1].pass_rate - runs[0].pass_rate)}%</div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Recent Comparisons</h3>
              <Link to="/history" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="space-y-3">
              {recent.map((run) => (
                <Link key={run.id} to={`/results/${run.id}`} className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-alt)] flex items-center justify-center">
                      <Clock size={18} className="text-[var(--color-text-secondary)]" />
                    </div>
                    <div>
                      <p className="font-medium">{run.project}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{run.compare_url} · {run.date ? new Date(run.date).toLocaleDateString() : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={clsx("text-lg font-bold", run.pass_rate >= 90 ? "text-[var(--color-success)]" : run.pass_rate >= 80 ? "text-[var(--color-warning)]" : "text-[var(--color-error)]")}>{run.pass_rate}%</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
