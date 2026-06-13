import type { Job } from '../types'

interface Props { jobs: Job[] }

export default function ResumeAnalytics({ jobs }: Props) {
  const resumeMap = new Map<string, { total: number; offers: number; interviewed: number }>()

  for (const job of jobs) {
    if (!job.resume) continue
    const cur = resumeMap.get(job.resume) || { total: 0, offers: 0, interviewed: 0 }
    cur.total++
    if (job.status === 'offer') cur.offers++
    if (job.status === 'interview' || job.status === 'offer') cur.interviewed++
    resumeMap.set(job.resume, cur)
  }

  if (resumeMap.size === 0) return null

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-4">📄 Resume Analytics</h3>
      <div className="space-y-2.5">
        {Array.from(resumeMap.entries()).map(([name, stats]) => {
          const interviewRate = stats.total > 0 ? Math.round((stats.interviewed / stats.total) * 100) : 0
          const successRate = stats.total > 0 ? Math.round((stats.offers / stats.total) * 100) : 0
          return (
            <div key={name} className="flex items-center justify-between text-xs py-1 border-b border-[var(--color-border)]/30 dark:border-[var(--color-border-dark)]/30 last:border-0">
              <span className="text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] font-medium truncate flex-1">{name}</span>
              <div className="flex gap-4 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">
                <span className="font-medium">Used {stats.total}x</span>
                <span>📞 {interviewRate}%</span>
                <span>🎉 {successRate}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
