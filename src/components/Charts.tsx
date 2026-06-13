import type { Job } from '../types'
import { COLUMNS, STATUS_LABELS } from '../types'

interface Props { jobs: Job[] }

export default function Charts({ jobs }: Props) {
  const statusCounts = COLUMNS.map(s => jobs.filter(j => j.status === s).length)
  const total = jobs.length || 1
  const statusColors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#f97316', '#10b981', '#ef4444']

  const monthMap = new Map<string, number>()
  for (const job of jobs) {
    if (!job.dateApplied) continue
    const d = new Date(job.dateApplied)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  }
  const months = Array.from(monthMap.entries()).sort().slice(-6)
  const maxMonthCount = Math.max(...months.map(([, c]) => c), 1)

  const wishlist = jobs.filter(j => j.status === 'wishlist').length
  const applied = jobs.filter(j => j.status === 'applied' || j.status === 'follow-up').length
  const interviewed = jobs.filter(j => j.status === 'interview' || j.status === 'offer').length
  const offered = jobs.filter(j => j.status === 'offer').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-2">
      <div className="glass rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-4">Status Distribution</h3>
        <div className="flex gap-1 h-5 rounded-full overflow-hidden mb-4">
          {statusCounts.map((count, i) =>
            count > 0 ? <div key={i} style={{ width: `${(count / total) * 100}%`, backgroundColor: statusColors[i] }} className="h-full first:rounded-l-full last:rounded-r-full transition-all" /> : null
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {COLUMNS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColors[i] }} />
              <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">{STATUS_LABELS[s]}</span>
              <span className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">{statusCounts[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-4">Apps by Month</h3>
        <div className="flex items-end gap-2 h-28">
          {months.map(([month, count]) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">{count}</span>
              <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300" style={{ height: `${(count / maxMonthCount) * 85}%`, minHeight: count > 0 ? 4 : 0 }} />
              <span className="text-[9px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">{month.split('-')[1]}</span>
            </div>
          ))}
          {months.length === 0 && <p className="text-xs text-[var(--color-text-secondary)] w-full text-center py-6">No data yet</p>}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-4">Interview Funnel</h3>
        <div className="space-y-2.5">
          <FunnelBar label="Wishlist" count={wishlist} max={total} color="from-blue-500 to-blue-600" />
          <FunnelBar label="Applied" count={applied} max={total} color="from-yellow-500 to-yellow-600" />
          <FunnelBar label="Interviewed" count={interviewed} max={total} color="from-orange-500 to-orange-600" />
          <FunnelBar label="Offered" count={offered} max={total} color="from-green-500 to-green-600" />
        </div>
      </div>
    </div>
  )
}

function FunnelBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const width = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-20 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] font-medium">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-6 text-right font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">{count}</span>
    </div>
  )
}
