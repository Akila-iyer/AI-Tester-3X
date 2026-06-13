import type { ActivityEntry } from '../types'
import { formatDate } from '../types'

interface Props { activities: ActivityEntry[] }

const TYPE_ICONS: Record<string, string> = {
  added: '➕', moved: '🔄', edited: '✏️', deleted: '🗑️', rejected: '❌', interview: '🎤',
}

export default function ActivityFeed({ activities }: Props) {
  const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp)
  const recent = sorted.slice(0, 20)

  if (recent.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-4">📝 Recent Activity</h3>
        <p className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] text-center py-6">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-4">📝 Recent Activity</h3>
      <div className="space-y-1 max-h-52 overflow-y-auto">
        {recent.map(entry => (
          <div key={entry.id} className="flex items-center gap-2.5 py-1.5 border-b border-[var(--color-border)]/40 dark:border-[var(--color-border-dark)]/40 last:border-0">
            <span className="text-xs">{TYPE_ICONS[entry.type] || '📌'}</span>
            <p className="text-xs text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] flex-1 truncate">{entry.message}</p>
            <span className="text-[10px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] whitespace-nowrap font-medium">
              {formatDate(new Date(entry.timestamp).toISOString().split('T')[0])}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
