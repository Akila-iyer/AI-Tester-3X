import clsx from "clsx";

export default function StatusBadge({ status, severity }) {
  const colorMap = {
    PASS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    FAIL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const label = status || severity;
  return (
    <span className={clsx("inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold", colorMap[label] || "bg-gray-100 text-gray-700")}>
      {label}
    </span>
  );
}
