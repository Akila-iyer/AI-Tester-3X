import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Job, NewJob, JobStatus, Priority } from './types'
import { COLUMNS, PRIORITY_LABELS, emptyQA } from './types'
import { getAllJobs, addJob, updateJob, deleteJob, clearAllJobs, importJob } from './db'
import KanbanColumn from './components/KanbanColumn'
import JobModal from './components/JobModal'
import JobDetailModal from './components/JobDetailModal'
import ConfirmModal from './components/ConfirmModal'
import JobCard from './components/JobCard'
import Dashboard from './components/Dashboard'
import Charts from './components/Charts'
import ApplicationGoalTracker from './components/ApplicationGoalTracker'
import ActivityFeed from './components/ActivityFeed'
import ResumeAnalytics from './components/ResumeAnalytics'
import { generateSampleData } from './sampleData'

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortByDate, setSortByDate] = useState(false)
  const [darkMode, setDarkMode] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('darkMode') === 'true' : false)
  const [filterStatus, setFilterStatus] = useState<JobStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [filterResume, setFilterResume] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [viewingJob, setViewingJob] = useState<Job | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeDragJob, setActiveDragJob] = useState<Job | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const loadJobs = useCallback(async () => {
    const all = await getAllJobs()
    if (all.length === 0) {
      const sample = generateSampleData()
      for (const j of sample) await addJob(j)
      setJobs(sample)
    } else {
      setJobs(all)
    }
    setLoading(false)
  }, [])

  async function loadDemoData() {
    await clearAllJobs()
    const sample = generateSampleData()
    for (const j of sample) await addJob(j)
    setJobs(sample)
    setImportStatus('Loaded 25 demo jobs')
    setTimeout(() => setImportStatus(null), 3000)
  }

  useEffect(() => { loadJobs() }, [loadJobs])

  const resumeOptions = useMemo(() => Array.from(new Set(jobs.map(j => j.resume).filter(Boolean))).sort(), [jobs])

  const filteredJobs = useMemo(() => {
    let result = jobs
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(j =>
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        j.resume.toLowerCase().includes(q) ||
        j.notes.toLowerCase().includes(q) ||
        PRIORITY_LABELS[j.priority].toLowerCase().includes(q) ||
        j.qa.recruiterName.toLowerCase().includes(q) ||
        j.interviews.some(iv => iv.interviewerName.toLowerCase().includes(q)) ||
        j.qa.applicationSource.toLowerCase().includes(q)
      )
    }
    if (filterStatus) result = result.filter(j => j.status === filterStatus)
    if (filterPriority) result = result.filter(j => j.priority === filterPriority)
    if (filterResume) result = result.filter(j => j.resume === filterResume)
    if (filterSource) result = result.filter(j => j.qa.applicationSource === filterSource)
    if (dateRangeStart) result = result.filter(j => !j.dateApplied || j.dateApplied >= dateRangeStart)
    if (dateRangeEnd) result = result.filter(j => !j.dateApplied || j.dateApplied <= dateRangeEnd)
    if (sortByDate) {
      result = [...result].sort((a, b) => {
        if (!a.dateApplied && !b.dateApplied) return 0
        if (!a.dateApplied) return 1; if (!b.dateApplied) return -1
        return new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
      })
    }
    return result
  }, [jobs, search, sortByDate, filterStatus, filterPriority, filterResume, filterSource, dateRangeStart, dateRangeEnd])

  const columnJobs = useMemo(() => {
    const map: Record<string, Job[]> = {}
    for (const col of COLUMNS) map[col] = filteredJobs.filter(j => j.status === col)
    return map
  }, [filteredJobs])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(event: DragStartEvent) {
    const j = jobs.find(jj => jj.id === event.active.id)
    if (j) setActiveDragJob(j)
  }

  function makeTimelineEntry(status: JobStatus) {
    const now = new Date()
    return {
      status,
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      timestamp: Date.now(),
    }
  }

  function addActivity(jobId: string, type: 'added' | 'moved' | 'edited' | 'deleted' | 'rejected' | 'interview', message: string) {
    const activity = { id: crypto.randomUUID(), type, message, timestamp: Date.now() }
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, activities: [...j.activities, activity] } : j))
    return activity
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragJob(null)
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string; const overId = over.id as string
    const dragged = jobs.find(j => j.id === activeId)
    if (!dragged) return
    const targetStatus = COLUMNS.includes(overId as JobStatus) ? overId as JobStatus : null
    let newStatus: JobStatus | null = null
    if (targetStatus && targetStatus !== dragged.status) newStatus = targetStatus
    else if (!targetStatus) { const overJob = jobs.find(j => j.id === overId); if (overJob && overJob.status !== dragged.status) newStatus = overJob.status }
    if (newStatus) {
      const timeline = [...dragged.timeline, makeTimelineEntry(newStatus)]
      const act = addActivity(activeId, 'moved', `Moved ${dragged.company} to ${newStatus}`)
      const updated = { ...dragged, status: newStatus, timeline, activities: [...dragged.activities, act], updatedAt: Date.now() }
      await updateJob(updated)
      setJobs(prev => prev.map(j => j.id === activeId ? updated : j))
    }
  }

  async function handleAddJob(data: NewJob) {
    const now = Date.now()
    const timeline = [makeTimelineEntry(data.status)]
    const activity = { id: crypto.randomUUID(), type: 'added' as const, message: `Added ${data.company} - ${data.role}`, timestamp: now }
    const job: Job = { ...data, id: crypto.randomUUID(), timeline, activities: [activity], createdAt: now, updatedAt: now }
    await addJob(job)
    setJobs(prev => [...prev, job])
    setShowModal(false)
  }

  async function handleEditJob(data: NewJob) {
    if (!editingJob) return
    let timeline = editingJob.timeline
    if (data.status !== editingJob.status) timeline = [...timeline, makeTimelineEntry(data.status)]
    const activity = addActivity(editingJob.id, 'edited', `Edited ${editingJob.company} - ${editingJob.role}`)
    const updated: Job = { ...editingJob, ...data, timeline, activities: [...editingJob.activities, activity], updatedAt: Date.now() }
    await updateJob(updated)
    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j))
    setEditingJob(null)
  }

  async function handleDelete(id: string) {
    await deleteJob(id)
    setJobs(prev => prev.filter(j => j.id !== id))
    setDeleteId(null)
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `job-tracker-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        let raw: unknown
        try { raw = JSON.parse(reader.result as string) } catch { throw new Error('Invalid JSON') }

        // Accept single job object or array
        const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : [raw]
        if (items.length === 0) throw new Error('Empty file')

        const now = Date.now()
        let count = 0
        for (const item of items) {
          if (!item || typeof item !== 'object') continue
          const company = typeof item.company === 'string' && item.company.trim() ? item.company.trim() : ''
          const role = typeof item.role === 'string' && item.role.trim() ? item.role.trim() : ''
          if (!company && !role) continue // skip invalid items

          const j: Job = {
            id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
            company: company || 'Unknown Company',
            role: role || 'Unknown Role',
            linkedinUrl: typeof item.linkedinUrl === 'string' ? item.linkedinUrl : '',
            resume: typeof item.resume === 'string' ? item.resume : '',
            dateApplied: typeof item.dateApplied === 'string' ? item.dateApplied : '',
            salaryRange: typeof item.salaryRange === 'string' ? item.salaryRange : '',
            notes: typeof item.notes === 'string' ? item.notes : '',
            status: COLUMNS.includes(item.status as JobStatus) ? (item.status as JobStatus) : 'wishlist',
            priority: ['urgent', 'high', 'medium', 'low'].includes(item.priority as string) ? (item.priority as Priority) : 'medium',
            timeline: Array.isArray(item.timeline) ? item.timeline : [],
            interviews: Array.isArray(item.interviews) ? item.interviews : [],
            qa: item.qa && typeof item.qa === 'object'
              ? { ...emptyQA(), ...(item.qa as Record<string, unknown>) }
              : emptyQA(),
            activities: Array.isArray(item.activities) ? item.activities : [],
            createdAt: typeof item.createdAt === 'number' ? item.createdAt : now,
            updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : now,
          }
          await importJob(j)
          count++
        }
        await loadJobs()
        setImportStatus(`Imported ${count} jobs`); setTimeout(() => setImportStatus(null), 3000)
      } catch { setImportStatus('Invalid JSON file'); setTimeout(() => setImportStatus(null), 3000) }
    }
    reader.readAsText(file); e.target.value = ''
  }

  const selectClass = 'text-xs px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-card)] dark:bg-[var(--color-card-dark)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer'

  const allActivities = useMemo(() => jobs.flatMap(j => j.activities), [jobs])
  const totalApplications = jobs.filter(j => j.status !== 'wishlist').length

  if (loading) return <div className="flex items-center justify-center h-screen text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">Loading...</div>

  return (
    <div className="h-screen flex flex-col bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] transition-colors">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass rounded-none border-b border-[var(--glass-border)] dark:border-[var(--glass-border-dark)] px-6 py-3">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Job Tracker</h1>
          <div className="h-5 w-px bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
          <span className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">{jobs.length} jobs</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="text" placeholder="Search company, role, recruiter..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-48 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          <select className={selectClass} value={filterStatus} onChange={e => setFilterStatus(e.target.value as JobStatus | '')}>
            <option value="">Status</option>{COLUMNS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select className={selectClass} value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | '')}>
            <option value="">Priority</option>{(Object.keys(PRIORITY_LABELS) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
          <select className={selectClass} value={filterResume} onChange={e => setFilterResume(e.target.value)}>
            <option value="">Resume</option>{resumeOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className={selectClass} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="">Source</option>
            <option value="linkedin">LinkedIn</option><option value="naukri">Naukri</option>
            <option value="company_website">Website</option><option value="referral">Referral</option><option value="indeed">Indeed</option>
          </select>
          <input type="date" className={selectClass} value={dateRangeStart} onChange={e => setDateRangeStart(e.target.value)} placeholder="From" title="From date" />
          <input type="date" className={selectClass} value={dateRangeEnd} onChange={e => setDateRangeEnd(e.target.value)} placeholder="To" title="To date" />
          <button onClick={() => setSortByDate(!sortByDate)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-all ${sortByDate ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' : 'border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{sortByDate ? 'Date ↓' : 'Date ↑'}</button>
          <label className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">Import<input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
          <button onClick={handleExport} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">Export</button>
          <button onClick={loadDemoData} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors" title="Reload 25 demo jobs">🎲 Demo</button>
          <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">{darkMode ? '☀️' : '🌙'}</button>
          <button onClick={() => setShowModal(true)} className="px-4 py-1.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all cursor-pointer">+ Add Job</button>
        </div>
        </div>
      </header>

      {importStatus && <div className="px-6 py-2 text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30">{importStatus}</div>}

      <div className="flex-1 overflow-y-auto">
        {/* Dashboard */}
        <Dashboard jobs={jobs} />

        {/* Goal Tracker + Analytics row */}
        <div className="grid grid-cols-4 gap-3 px-6 pb-2">
          <ApplicationGoalTracker completed={totalApplications} />
          <ActivityFeed activities={allActivities} />
          <div className="col-span-2"><ResumeAnalytics jobs={jobs} /></div>
        </div>

        {/* Charts */}
        <Charts jobs={jobs} />

        {/* Board */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto px-6 pb-6 pt-2">
            {COLUMNS.map(status => (
              <KanbanColumn key={status} status={status} jobs={columnJobs[status]} onEdit={j => setEditingJob(j)} onDelete={id => setDeleteId(id)} onClick={j => setViewingJob(j)} />
            ))}
          </div>
          <DragOverlay>{activeDragJob && <div className="w-72 opacity-90"><JobCard job={activeDragJob} onEdit={() => {}} onDelete={() => {}} onClick={() => {}} /></div>}</DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      {showModal && <JobModal onSubmit={handleAddJob} onClose={() => setShowModal(false)} />}
      {editingJob && <JobModal key={editingJob.id} job={editingJob} onSubmit={handleEditJob} onClose={() => setEditingJob(null)} />}
      {viewingJob && <JobDetailModal job={viewingJob} onClose={() => setViewingJob(null)} onEdit={j => { setViewingJob(null); setEditingJob(j) }} />}
      {deleteId && <ConfirmModal title="Delete Job" message="Are you sure you want to delete this job application? This cannot be undone." onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
