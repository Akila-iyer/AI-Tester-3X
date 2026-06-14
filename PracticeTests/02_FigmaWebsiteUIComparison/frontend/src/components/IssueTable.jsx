import { useState } from "react";
import { Search, ArrowUpDown, ChevronDown, ChevronUp, Filter } from "lucide-react";
import StatusBadge from "./StatusBadge";
import clsx from "clsx";

export default function IssueTable({ issues, onRowClick }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("severity");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = issues
    .filter((i) => (filterSeverity === "all" || i.severity === filterSeverity) &&
      (i.element.toLowerCase().includes(search.toLowerCase()) || i.property.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "severity") cmp = (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
      else if (sortField === "element") cmp = a.element.localeCompare(b.element);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="text" placeholder="Search elements or properties..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--color-text-secondary)]" />
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <button key={s} onClick={() => setFilterSeverity(s)}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                filterSeverity === s ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
              )}>{s === "all" ? "All" : s}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
              {["#", "Element", "Property", "Expected", "Actual", "Status", "Severity"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer select-none" onClick={() => h !== "Expected" && h !== "Actual" && h !== "#" && toggleSort(h.toLowerCase())}>
                  <div className="flex items-center gap-1">{h} {h.toLowerCase() !== "expected" && h.toLowerCase() !== "actual" && h !== "#" && <SortIcon field={h.toLowerCase()} />}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue, i) => (
              <tr key={issue.id} onClick={() => onRowClick?.(issue)} className={clsx("border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer transition-colors", i % 2 === 1 && "bg-[var(--color-surface-alt)]/50")}>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{issue.id}</td>
                <td className="px-4 py-3 font-medium">{issue.element}</td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{issue.property}</td>
                <td className="px-4 py-3">{issue.expected}</td>
                <td className="px-4 py-3">{issue.actual}</td>
                <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                <td className="px-4 py-3"><StatusBadge severity={issue.severity} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-[var(--color-text-secondary)] text-sm">No issues match your filters.</p>}
      </div>
    </div>
  );
}
