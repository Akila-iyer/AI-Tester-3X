import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Job, JobStatus } from '../types'
import { STATUS_LABELS } from '../types'
import JobCard from './JobCard'

interface Props {
  status: JobStatus
  jobs: Job[]
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onClick: (job: Job) => void
}

const HEADER_GRADIENTS: Record<JobStatus, string> = {
  wishlist: 'from-blue-500 to-blue-600',
  applied: 'from-yellow-500 to-yellow-600',
  'follow-up': 'from-purple-500 to-purple-600',
  interview: 'from-orange-500 to-orange-600',
  offer: 'from-green-500 to-green-600',
  rejected: 'from-red-500 to-red-600',
}

const EMPTY_MESSAGES: Record<JobStatus, { icon: string; text: string }> = {
  wishlist: { icon: '📋', text: 'Jobs you\'re eyeing but haven\'t applied to yet' },
  applied: { icon: '📤', text: 'Applications you\'ve sent out' },
  'follow-up': { icon: '📨', text: 'Jobs where you\'ve followed up' },
  interview: { icon: '🎤', text: 'Interviews scheduled or completed' },
  offer: { icon: '🎉', text: 'Congratulations — offers received!' },
  rejected: { icon: '❌', text: 'Keep going — rejections happen' },
}

export default function KanbanColumn({ status, jobs, onEdit, onDelete, onClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const empty = EMPTY_MESSAGES[status]

  return (
    <div
      className={`flex flex-col w-80 min-w-80 shrink-0 rounded-2xl glass transition-all duration-300 ${isOver ? 'ring-2 ring-blue-400 shadow-xl scale-[1.01]' : ''}`}
    >
      {/* Gradient header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl bg-gradient-to-r ${HEADER_GRADIENTS[status]}`}>
        <h2 className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-sm">
          {STATUS_LABELS[status]}
        </h2>
        <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
          {jobs.length}
        </span>
      </div>

      {/* Cards area */}
      <div ref={setNodeRef} className="flex flex-col gap-3 p-3 overflow-y-auto flex-1 min-h-0">
        <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job, idx) => (
            <div key={job.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
              <JobCard job={job} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />
            </div>
          ))}
        </SortableContext>
        {jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span className="text-3xl mb-3 opacity-70">{empty.icon}</span>
            <p className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] font-medium">{empty.text}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mt-1.5 opacity-50">Drag a card here or add a new job</p>
          </div>
        )}
      </div>
    </div>
  )
}
