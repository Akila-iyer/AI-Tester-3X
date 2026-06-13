import { useEffect, useRef, useState } from 'react'
import type { Job, NewJob, Priority, JobStatus, ApplicationSource, InterviewRound } from '../types'
import { STATUS_LABELS, COLUMNS, PRIORITY_LABELS, APPLICATION_SOURCES, INTERVIEW_ROUND_LABELS } from '../types'

interface Props {
  job?: Job | null
  onSubmit: (data: NewJob) => void
  onClose: () => void
}

function emptyForm(): NewJob {
  return {
    company: '',
    role: '',
    linkedinUrl: '',
    resume: '',
    dateApplied: '',
    salaryRange: '',
    notes: '',
    status: 'wishlist',
    priority: 'medium',
    qa: {
      recruiterName: '',
      recruiterEmail: '',
      interviewMode: '',
      interviewLocation: '',
      expectedSalary: '',
      actualOfferedSalary: '',
      applicationSource: 'linkedin',
      referralName: '',
      applicationId: '',
      nextFollowUpDate: '',
    },
    interviews: [],
  }
}

export default function JobModal({ job, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<NewJob>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const titleRef = useRef<HTMLInputElement>(null)
  const [newInterview, setNewInterview] = useState({ date: '', time: '', mode: 'online' as 'online' | 'offline', meetingLink: '', interviewerName: '', round: 'technical' as InterviewRound, notes: '' })

  useEffect(() => {
    if (job) {
      setForm({
        company: job.company,
        role: job.role,
        linkedinUrl: job.linkedinUrl,
        resume: job.resume,
        dateApplied: job.dateApplied,
        salaryRange: job.salaryRange,
        notes: job.notes,
        status: job.status,
        priority: job.priority,
        qa: { ...job.qa },
        interviews: job.interviews || [],
      })
    } else {
      setForm(emptyForm())
    }
    titleRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [job, onClose])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.company.trim()) errs.company = 'Company is required'
    if (!form.role.trim()) errs.role = 'Job title is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  function setField<K extends keyof NewJob>(k: K, v: NewJob[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function setQaField<K extends keyof NewJob['qa']>(k: K, v: NewJob['qa'][K]) {
    setForm(prev => ({ ...prev, qa: { ...prev.qa, [k]: v } }))
  }

  function addInterview() {
    if (!newInterview.date || !newInterview.time) return
    setForm(prev => ({
      ...prev,
      interviews: [...prev.interviews, { ...newInterview, id: crypto.randomUUID() }],
    }))
    setNewInterview({ date: '', time: '', mode: 'online', meetingLink: '', interviewerName: '', round: 'technical', notes: '' })
  }

  function removeInterview(id: string) {
    setForm(prev => ({ ...prev, interviews: prev.interviews.filter(i => i.id !== id) }))
  }

  const sectionTitle = 'text-sm font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] mb-3 mt-2 first:mt-0'
  const inputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-card)] dark:bg-[var(--color-card-dark)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all'
  const labelClass = 'block text-xs font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-card)] dark:bg-[var(--color-card-dark)] rounded-xl shadow-2xl p-6 w-full max-w-3xl mx-4 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">{job ? 'Edit Job' : 'Add Job'}</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:hover:text-[var(--color-text-primary-dark)] text-lg cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic */}
          <div>
            <h3 className={sectionTitle}>Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Company *</label>
                <input ref={titleRef} className={inputClass} placeholder="Acme Corp" value={form.company} onChange={e => setField('company', e.target.value)} />
                {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
              </div>
              <div>
                <label className={labelClass}>Job Title *</label>
                <input className={inputClass} placeholder="Software Engineer" value={form.role} onChange={e => setField('role', e.target.value)} />
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
              </div>
            </div>
          </div>

          {/* Details */}
          <div>
            <h3 className={sectionTitle}>Job Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>LinkedIn URL</label><input className={inputClass} placeholder="https://linkedin.com/jobs/..." value={form.linkedinUrl} onChange={e => setField('linkedinUrl', e.target.value)} /></div>
              <div><label className={labelClass}>Resume Used</label><input className={inputClass} placeholder="resume-v3.pdf" value={form.resume} onChange={e => setField('resume', e.target.value)} /></div>
              <div><label className={labelClass}>Date Applied</label><input type="date" className={inputClass} value={form.dateApplied} onChange={e => setField('dateApplied', e.target.value)} /></div>
              <div><label className={labelClass}>Salary Range</label><input className={inputClass} placeholder="$80k - $120k" value={form.salaryRange} onChange={e => setField('salaryRange', e.target.value)} /></div>
            </div>
          </div>

          {/* Status & Priority */}
          <div>
            <h3 className={sectionTitle}>Status & Priority</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={e => setField('status', e.target.value as JobStatus)}>
                  {COLUMNS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select className={inputClass} value={form.priority} onChange={e => setField('priority', e.target.value as Priority)}>
                  {(Object.keys(PRIORITY_LABELS) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* QA / Testing */}
          <div>
            <h3 className={sectionTitle}>📋 Testing Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Recruiter Name</label><input className={inputClass} placeholder="Jane Doe" value={form.qa.recruiterName} onChange={e => setQaField('recruiterName', e.target.value)} /></div>
              <div><label className={labelClass}>Recruiter Email</label><input className={inputClass} placeholder="jane@company.com" value={form.qa.recruiterEmail} onChange={e => setQaField('recruiterEmail', e.target.value)} /></div>
              <div><label className={labelClass}>Interview Mode</label><select className={inputClass} value={form.qa.interviewMode} onChange={e => setQaField('interviewMode', e.target.value as '' | 'online' | 'offline')}><option value="">Select</option><option value="online">Online</option><option value="offline">Offline</option></select></div>
              <div><label className={labelClass}>Interview Location</label><input className={inputClass} placeholder="Room 301, HQ" value={form.qa.interviewLocation} onChange={e => setQaField('interviewLocation', e.target.value)} /></div>
              <div><label className={labelClass}>Expected Salary</label><input className={inputClass} placeholder="$90k" value={form.qa.expectedSalary} onChange={e => setQaField('expectedSalary', e.target.value)} /></div>
              <div><label className={labelClass}>Actual Offered</label><input className={inputClass} placeholder="$95k" value={form.qa.actualOfferedSalary} onChange={e => setQaField('actualOfferedSalary', e.target.value)} /></div>
              <div><label className={labelClass}>Application Source</label><select className={inputClass} value={form.qa.applicationSource} onChange={e => setQaField('applicationSource', e.target.value as ApplicationSource)}>{APPLICATION_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div><label className={labelClass}>Referral Name</label><input className={inputClass} placeholder="John Smith" value={form.qa.referralName} onChange={e => setQaField('referralName', e.target.value)} /></div>
              <div><label className={labelClass}>Application ID</label><input className={inputClass} placeholder="APP-12345" value={form.qa.applicationId} onChange={e => setQaField('applicationId', e.target.value)} /></div>
              <div><label className={labelClass}>Next Follow-up</label><input type="date" className={inputClass} value={form.qa.nextFollowUpDate} onChange={e => setQaField('nextFollowUpDate', e.target.value)} /></div>
            </div>
          </div>

          {/* Interview Tracking */}
          <div>
            <h3 className={sectionTitle}>🎤 Interview Tracking</h3>
            {form.interviews.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.interviews.map(iv => (
                  <div key={iv.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">{INTERVIEW_ROUND_LABELS[iv.round]} - {iv.date} {iv.time}</span>
                    <button type="button" onClick={() => removeInterview(iv.id)} className="text-red-500 hover:text-red-700 cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={newInterview.date} onChange={e => setNewInterview(p => ({ ...p, date: e.target.value }))} /></div>
              <div><label className={labelClass}>Time</label><input type="text" className={inputClass} placeholder="10:00 AM" value={newInterview.time} onChange={e => setNewInterview(p => ({ ...p, time: e.target.value }))} /></div>
              <div><label className={labelClass}>Mode</label><select className={inputClass} value={newInterview.mode} onChange={e => setNewInterview(p => ({ ...p, mode: e.target.value as 'online' | 'offline' }))}><option value="online">Online</option><option value="offline">Offline</option></select></div>
              <div><label className={labelClass}>Meeting Link</label><input className={inputClass} placeholder="https://..." value={newInterview.meetingLink} onChange={e => setNewInterview(p => ({ ...p, meetingLink: e.target.value }))} /></div>
              <div><label className={labelClass}>Interviewer</label><input className={inputClass} placeholder="Name" value={newInterview.interviewerName} onChange={e => setNewInterview(p => ({ ...p, interviewerName: e.target.value }))} /></div>
              <div><label className={labelClass}>Round</label><select className={inputClass} value={newInterview.round} onChange={e => setNewInterview(p => ({ ...p, round: e.target.value as InterviewRound }))}>
                {(Object.keys(INTERVIEW_ROUND_LABELS) as InterviewRound[]).map(r => <option key={r} value={r}>{INTERVIEW_ROUND_LABELS[r]}</option>)}
              </select></div>
              <div className="col-span-3"><label className={labelClass}>Notes</label><input className={inputClass} placeholder="Interview notes..." value={newInterview.notes} onChange={e => setNewInterview(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <button type="button" onClick={addInterview} className="text-xs text-blue-500 hover:underline cursor-pointer">+ Add Interview</button>
          </div>

          {/* Notes */}
          <div>
            <h3 className={sectionTitle}>Notes</h3>
            <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Any notes..." value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]/50 dark:border-[var(--color-border-dark)]/50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all cursor-pointer">{job ? 'Save Changes' : 'Add Job'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
