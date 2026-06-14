import clsx from "clsx";

export default function SummaryCards({ summary }) {
  const cards = [
    { label: "Total Checks", value: summary.total_checks, color: "text-[var(--color-text)]" },
    { label: "Passed", value: summary.pass_count, color: "text-[var(--color-success)]" },
    { label: "Failed", value: summary.fail_count, color: "text-[var(--color-error)]" },
    { label: "Pass Rate", value: `${summary.pass_percentage}%`, color: summary.pass_percentage >= 90 ? "text-[var(--color-success)]" : summary.pass_percentage >= 80 ? "text-[var(--color-warning)]" : "text-[var(--color-error)]" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">{c.label}</p>
          <p className={clsx("text-2xl font-bold mt-1", c.color)}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
