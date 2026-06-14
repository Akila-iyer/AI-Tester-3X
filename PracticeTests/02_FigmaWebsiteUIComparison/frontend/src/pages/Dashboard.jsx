import { Link } from "react-router-dom";
import { PlusCircle, BarChart3, Clock, TrendingDown, ArrowRight } from "lucide-react";
import { Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from "chart.js";
import { mockHistory } from "../data/mock";
import clsx from "clsx";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const recent = mockHistory.slice(0, 3);

const doughnutData = {
  labels: ["Pass", "Fail"],
  datasets: [{ data: [992, 144], backgroundColor: ["#22c55e", "#ef4444"], borderWidth: 0 }],
};

const lineData = {
  labels: mockHistory.slice().reverse().map((h) => h.date.slice(0, 10)),
  datasets: [{
    label: "Pass Rate %",
    data: mockHistory.slice().reverse().map((h) => h.pass_rate),
    borderColor: "#4f46e5",
    backgroundColor: "rgba(79,70,229,0.1)",
    fill: true,
    tension: 0.3,
    pointBackgroundColor: "#4f46e5",
  }],
};

const lineOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: { x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10 } } }, y: { min: 80, max: 100, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } } },
};

export default function Dashboard() {
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

      {/* Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Pass Rate Trend</h3>
          <Line data={lineData} options={lineOptions} height={200} />
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Latest Run</h3>
          <div className="w-32 h-32">
            <Doughnut data={doughnutData} options={{ cutout: "75%", plugins: { tooltip: { enabled: false }, legend: { display: false } } }} />
          </div>
          <p className="text-2xl font-bold mt-2">87.3%</p>
          <p className="text-xs text-[var(--color-text-secondary)]">992 / 1,136 passed</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-[var(--color-error)]"><TrendingDown size={14} /> Down 2.1% from last week</div>
        </div>
      </div>

      {/* Recent Runs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Recent Comparisons</h3>
          <Link to="/history" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">View All <ArrowRight size={14} /></Link>
        </div>
        <div className="space-y-3">
          {recent.map((run) => (
            <div key={run.id} className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", run.trend === "decreasing" ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20")}>
                  <Clock size={18} className={run.trend === "decreasing" ? "text-red-500" : "text-green-500"} />
                </div>
                <div>
                  <p className="font-medium">{run.project}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{run.compare_url} · {new Date(run.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={clsx("text-lg font-bold", run.pass_rate >= 90 ? "text-[var(--color-success)]" : run.pass_rate >= 80 ? "text-[var(--color-warning)]" : "text-[var(--color-error)]")}>{run.pass_rate}%</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{run.issue_count} issues</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
