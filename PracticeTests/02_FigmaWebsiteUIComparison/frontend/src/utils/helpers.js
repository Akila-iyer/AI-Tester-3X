export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function severityColor(sev) {
  const map = { critical: "text-red-600 bg-red-50 dark:bg-red-900/20", high: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20", low: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" };
  return map[sev] || "text-gray-600 bg-gray-50";
}

export function statusColor(status) {
  return status === "PASS" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20";
}
