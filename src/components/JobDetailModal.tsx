import { useEffect } from 'react'
import type { Job } from '../types'
import { STATUS_LABELS, STATUS_BG_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, formatDate, formatTime, APPLICATION_SOURCES, INTERVIEW_ROUND_LABELS, computeReadinessScore, getApplicationHealth } from '../types'
import CompanyAvatar from './CompanyAvatar'
import ReadinessScore from './ReadinessScore'

interface Props {
  job: Job
  onClose: () => void
  onEdit: (job: Job) => void
}

export default function JobDetailModal({ job, onClose, onEdit }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const health = getApplicationHealth(job.dateApplied)
  const readiness = computeReadinessScore(job)

  // Countdown for next interview
  const nextInterview = job.interviews.length > 0 ? job.interviews.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] : null
  let countdownText = ''
  if (nextInterview?.date) {
    const diff = Math.floor((new Date(nextInterview.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff < 0) countdownText = 'Past due'
    else if (diff === 0) countdownText = 'Today'
    else if (diff === 1) countdownText = 'Tomorrow'
    else countdownText = `${diff} days`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-card)] dark:bg-[var(--color-card-dark)] rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <CompanyAvatar company={job.company} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">{job.role}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">{job.company}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { onEdit(job); onClose() }} className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all cursor-pointer">Edit</button>
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl glass text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] hover:bg-white/80 dark:hover:bg-white/10 transition-all cursor-pointer">Close</button>
          </div>
        </div>

        {/* Readiness Score */}
        <div className="mb-4">
          <ReadinessScore job={job} />
        </div>

        {/* Suggestions */}
        {readiness.suggestions.length > 0 && readiness.score < 100 && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Suggestions to improve:</p>
            <ul className="list-disc list-inside text-[11px] text-amber-600 dark:text-amber-300 space-y-0.5">
              {readiness.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BG_COLORS[job.status]}`}>{STATUS_LABELS[job.status]}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITY_COLORS[job.priority]}`}>{PRIORITY_LABELS[job.priority]}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${health.color}`}>{health.emoji} {health.label}</span>
          {job.salaryRange && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">💰 {job.salaryRange}</span>}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5 pb-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
          <DetailItem label="LinkedIn" value={job.linkedinUrl ? <a href={job.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View ↗</a> : '—'} />
          <DetailItem label="Resume" value={job.resume || '—'} />
          <DetailItem label="Date Applied" value={job.dateApplied ? `${formatDate(job.dateApplied)} (${health.emoji} ${health.label})` : '—'} />
          <DetailItem label="Salary" value={job.salaryRange || '—'} />
        </div>

        {/* QA Info */}
        <div className="mb-5 pb-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] mb-3">📋 Testing Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Recruiter" value={job.qa.recruiterName || '—'} />
            <DetailItem label="Email" value={job.qa.recruiterEmail || '—'} />
            <DetailItem label="Source" value={APPLICATION_SOURCES.find(s => s.value === job.qa.applicationSource)?.label || '—'} />
            <DetailItem label="Referral" value={job.qa.referralName || '—'} />
            <DetailItem label="Expected Salary" value={job.qa.expectedSalary || '—'} />
            <DetailItem label="Offered Salary" value={job.qa.actualOfferedSalary || '—'} />
            <DetailItem label="Application ID" value={job.qa.applicationId || '—'} />
            <DetailItem label="Next Follow-up" value={job.qa.nextFollowUpDate ? formatDate(job.qa.nextFollowUpDate) : '—'} />
          </div>
        </div>

        {/* Interview Tracking */}
        {job.interviews.length > 0 && (
          <div className="mb-5 pb-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] mb-3">🎤 Interviews</h3>
            <div className="space-y-2">
              {job.interviews.map(iv => (
                <div key={iv.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">{INTERVIEW_ROUND_LABELS[iv.round]} Round</span>
                      <p className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">{iv.date} at {iv.time} ({iv.mode})</p>
                    </div>
                    {iv.date && <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{countdownText}</span>}
                  </div>
                  {iv.interviewerName && <p className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mt-1">With: {iv.interviewerName}</p>}
                  {iv.meetingLink && <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline block mt-1">🔗 Meeting Link</a>}
                  {iv.notes && <p className="text-xs text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] mt-1">{iv.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {job.timeline.length > 0 && (
          <div className="mb-5 pb-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] mb-3">📈 Status Timeline</h3>
            <div className="space-y-0">
              {job.timeline.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                    {i < job.timeline.length - 1 && <div className="w-0.5 flex-1 bg-blue-200 dark:bg-blue-800 min-h-[24px]" />}
                  </div>
                  <div className="pb-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-block ${STATUS_BG_COLORS[entry.status].split(' ')[0]} text-gray-900 dark:text-gray-100`}>{STATUS_LABELS[entry.status]}</span>
                    <p className="text-[11px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mt-0.5">{entry.date} {entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <div className="mb-5 pb-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] mb-2">📝 Notes</h3>
            <p className="text-sm text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] whitespace-pre-wrap">{job.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">
          <span>Created: {formatDate(new Date(job.createdAt).toISOString().split('T')[0])} {formatTime(job.createdAt)}</span>
          <span>Updated: {formatDate(new Date(job.updatedAt).toISOString().split('T')[0])} {formatTime(job.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-sm text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">{value}</div>
    </div>
  )
}
