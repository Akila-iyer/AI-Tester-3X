import type { Job } from '../types'
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS, STATUS_BG_COLORS, formatDate, daysAgo } from '../types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CompanyAvatar from './CompanyAvatar'
import ApplicationHealth from './ApplicationHealth'
import ReadinessScore from './ReadinessScore'

interface Props {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onClick: (job: Job) => void
}

const STRIP_COLORS: Record<string, string> = {
  wishlist: '#3b82f6', applied: '#f59e0b', 'follow-up': '#8b5cf6',
  interview: '#f97316', offer: '#10b981', rejected: '#ef4444',
}

export default function JobCard({ job, onEdit, onDelete, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.id, data: { job } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(job)}
      {...attributes}
      {...listeners}
      className="relative bg-[var(--color-card)] dark:bg-[var(--color-card-dark)] rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-4 cursor-grab active:cursor-grabbing card-hover overflow-hidden"
    >
      {/* Colored left strip */}
      <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full" style={{ backgroundColor: STRIP_COLORS[job.status] }} />

      {/* Company + Role row */}
      <div className="flex items-start gap-3 mb-2.5 ml-1">
        <CompanyAvatar company={job.company} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] truncate">
            {job.role}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] truncate">
            {job.company}
          </p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(job) }}
            className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] hover:text-blue-500 text-xs p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer" title="Edit">✎</button>
          <button onClick={e => { e.stopPropagation(); onDelete(job.id) }}
            className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] hover:text-red-500 text-xs p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer" title="Delete">✕</button>
        </div>
      </div>

      {/* Badge row */}
      <div className="flex flex-wrap gap-1.5 mb-2.5 ml-1">
        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[job.priority]}`}>
          {PRIORITY_LABELS[job.priority]}
        </span>
        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${STATUS_BG_COLORS[job.status]}`}>
          {STATUS_LABELS[job.status]}
        </span>
        <ApplicationHealth dateApplied={job.dateApplied} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 ml-1 mb-2.5">
        {job.salaryRange && (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            💰 {job.salaryRange}
          </span>
        )}
        {job.linkedinUrl && (
          <a href={job.linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
             className="text-[10px] text-blue-500 hover:underline truncate font-medium">🔗 LinkedIn</a>
        )}
      </div>

      {/* Date */}
      {job.dateApplied && (
        <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-2.5 ml-1">
          <span className="font-medium">Applied: {formatDate(job.dateApplied)}</span>
          <span className="font-semibold text-blue-500 dark:text-blue-400">{daysAgo(job.dateApplied)}</span>
        </div>
      )}

      {/* Readiness Score */}
      <div className="ml-1">
        <ReadinessScore job={job} />
      </div>
    </div>
  )
}
