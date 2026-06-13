import type { Job } from '../types'

interface Props { jobs: Job[] }

const GRADIENTS: Record<string, string> = {
  Total: 'grad-blue', Wishlist: 'grad-cyan', Applied: 'grad-yellow',
  'Follow-up': 'grad-purple', Interview: 'grad-orange', Offer: 'grad-green',
  Rejected: 'grad-red', 'This Month': 'grad-sky', 'Interview Rate': 'grad-indigo',
  'Success Rate': 'grad-emerald', 'Offer Rate': 'grad-green',
  'Avg Days→Offer': 'grad-teal', 'Avg Days→Reject': 'grad-rose',
}

export default function Dashboard({ jobs }: Props) {
  const total = jobs.length
  const wishlist = jobs.filter(j => j.status === 'wishlist').length
  const applied = jobs.filter(j => j.status === 'applied').length
  const followUp = jobs.filter(j => j.status === 'follow-up').length
  const interviews = jobs.filter(j => j.status === 'interview').length
  const offers = jobs.filter(j => j.status === 'offer').length
  const rejected = jobs.filter(j => j.status === 'rejected').length

  const now = new Date()
  const appliedThisMonth = jobs.filter(j => { if (!j.dateApplied) return false; const d = new Date(j.dateApplied); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length

  const totalApplied = jobs.filter(j => j.status !== 'wishlist').length
  const interviewed = jobs.filter(j => j.status === 'interview' || j.status === 'offer').length
  const interviewRate = totalApplied > 0 ? Math.round((interviewed / totalApplied) * 100) : 0
  const successRate = totalApplied > 0 ? Math.round((offers / totalApplied) * 100) : 0
  const offerRate = totalApplied > 0 ? Math.round((offers / totalApplied) * 100) : 0

  const offerJobs = jobs.filter(j => j.status === 'offer' && j.dateApplied)
  const avgDaysToOffer = offerJobs.length > 0 ? Math.round(offerJobs.reduce((sum, j) => { const a = new Date(j.dateApplied); const o = new Date(j.updatedAt); return sum + Math.floor((o.getTime() - a.getTime()) / 86400000) }, 0) / offerJobs.length) : 0

  const rejectedJobs = jobs.filter(j => j.status === 'rejected' && j.dateApplied)
  const avgDaysToRejection = rejectedJobs.length > 0 ? Math.round(rejectedJobs.reduce((sum, j) => { const a = new Date(j.dateApplied); const r = new Date(j.updatedAt); return sum + Math.floor((r.getTime() - a.getTime()) / 86400000) }, 0) / rejectedJobs.length) : 0

  const stats = [
    { label: 'Total', value: total, icon: '📊' },
    { label: 'Wishlist', value: wishlist, icon: '📋' },
    { label: 'Applied', value: applied, icon: '📤' },
    { label: 'Follow-up', value: followUp, icon: '📨' },
    { label: 'Interview', value: interviews, icon: '🎤' },
    { label: 'Offer', value: offers, icon: '🎉' },
    { label: 'Rejected', value: rejected, icon: '❌' },
    { label: 'This Month', value: appliedThisMonth, icon: '📅' },
    { label: 'Interview Rate', value: `${interviewRate}%`, icon: '📞' },
    { label: 'Success Rate', value: `${successRate}%`, icon: '🎯' },
    { label: 'Offer Rate', value: `${offerRate}%`, icon: '💼' },
    { label: 'Avg Days→Offer', value: avgDaysToOffer, icon: '📆' },
    { label: 'Avg Days→Reject', value: avgDaysToRejection, icon: '⏱️' },
  ]

  return (
    <div className="px-6 pt-4 pb-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-13 gap-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`${GRADIENTS[s.label]} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 animate-fade-in`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg opacity-90">{s.icon}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider opacity-75">{s.label}</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
