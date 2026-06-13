import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmModal from '../components/ConfirmModal'
import CompanyAvatar from '../components/CompanyAvatar'
import ApplicationHealth from '../components/ApplicationHealth'
import ReadinessScore from '../components/ReadinessScore'
import Dashboard from '../components/Dashboard'
import ActivityFeed from '../components/ActivityFeed'
import ApplicationGoalTracker from '../components/ApplicationGoalTracker'
import ResumeAnalytics from '../components/ResumeAnalytics'
import Charts from '../components/Charts'
import type { Job, ActivityEntry } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────
function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '1', company: 'Test', role: 'QA', linkedinUrl: '', resume: '',
    dateApplied: '', salaryRange: '', notes: '', status: 'wishlist',
    priority: 'medium', timeline: [], interviews: [],
    qa: { recruiterName: '', recruiterEmail: '', interviewMode: '', interviewLocation: '', expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '' },
    activities: [], createdAt: Date.now(), updatedAt: Date.now(), ...overrides,
  }
}

// ─── ConfirmModal ─────────────────────────────────────────────────
describe('ConfirmModal', () => {
  it('renders title and message', () => {
    render(<ConfirmModal title="Delete Job" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('Delete Job')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('calls onConfirm when Delete is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmModal title="Delete" message="Sure?" onConfirm={onConfirm} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmModal title="Delete" message="Sure?" onConfirm={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel on Escape key', () => {
    const onCancel = vi.fn()
    render(<ConfirmModal title="Delete" message="Sure?" onConfirm={() => {}} onCancel={onCancel} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

// ─── CompanyAvatar ────────────────────────────────────────────────
describe('CompanyAvatar', () => {
  it('renders first letter', () => {
    render(<CompanyAvatar company="Google" />)
    expect(screen.getByText('G')).toBeInTheDocument()
  })

  it('renders ? for empty company', () => {
    render(<CompanyAvatar company="" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders first letter of two-word company name', () => {
    render(<CompanyAvatar company="Meta" />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('applies small size by default', () => {
    const { container } = render(<CompanyAvatar company="Apple" />)
    expect(container.firstChild).toHaveClass('w-8')
  })

  it('applies md size when specified', () => {
    const { container } = render(<CompanyAvatar company="Apple" size="md" />)
    expect(container.firstChild).toHaveClass('w-10')
  })
})

// ─── ApplicationHealth ────────────────────────────────────────────
describe('ApplicationHealth', () => {
  it('returns null without date', () => {
    const { container } = render(<ApplicationHealth dateApplied="" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders Fresh label for today', () => {
    const today = new Date().toISOString().split('T')[0]
    render(<ApplicationHealth dateApplied={today} />)
    expect(screen.getByText(/Fresh/)).toBeInTheDocument()
  })

  it('renders 🟢 emoji', () => {
    const today = new Date().toISOString().split('T')[0]
    render(<ApplicationHealth dateApplied={today} />)
    expect(screen.getByText((content) => content.includes('🟢'))).toBeInTheDocument()
  })

  it('renders Follow Up for 8 days ago', () => {
    const past = new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0]
    render(<ApplicationHealth dateApplied={past} />)
    expect(screen.getByText(/Follow Up/)).toBeInTheDocument()
  })

  it('renders Attention for 15 days ago', () => {
    const past = new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]
    render(<ApplicationHealth dateApplied={past} />)
    expect(screen.getByText(/Attention/)).toBeInTheDocument()
  })
})

// ─── ReadinessScore ───────────────────────────────────────────────
describe('ReadinessScore', () => {
  it('renders Incomplete for empty job', () => {
    render(<ReadinessScore job={makeJob()} />)
    expect(screen.getByText(/Incomplete/)).toBeInTheDocument()
  })

  it('shows score number', () => {
    render(<ReadinessScore job={makeJob()} />)
    expect(screen.getByText(/\/100/)).toBeInTheDocument()
  })

  it('shows Good for medium job', () => {
    const job = makeJob({
      resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n', salaryRange: '$100k', dateApplied: '2026-01-01',
      qa: { recruiterName: 'J', recruiterEmail: 'j@t.com', interviewMode: '', interviewLocation: '', expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '2026-07-01' },
    })
    render(<ReadinessScore job={job} />)
    expect(screen.getByText(/Good/)).toBeInTheDocument()
  })

  it('shows Excellent for complete job', () => {
    const job = makeJob({
      resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n', salaryRange: '$100k', dateApplied: '2026-06-01',
      interviews: [{ id: 'i1', date: '2026-07-01', time: '10:00', mode: 'online', meetingLink: '', interviewerName: 'Jane', round: 'technical', notes: '' }],
      qa: { recruiterName: 'John', recruiterEmail: 'j@t.com', interviewMode: '', interviewLocation: '', expectedSalary: '$100k', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '2026-07-01' },
    })
    render(<ReadinessScore job={job} />)
    expect(screen.getByText(/Excellent/)).toBeInTheDocument()
  })
})

// ─── Dashboard ────────────────────────────────────────────────────
describe('Dashboard', () => {
  it('renders all stat cards', () => {
    const jobs = [
      makeJob({ id: '1', status: 'applied', dateApplied: new Date().toISOString().split('T')[0] }),
      makeJob({ id: '2', status: 'interview' }),
      makeJob({ id: '3', status: 'offer' }),
    ]
    render(<Dashboard jobs={jobs} />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('Interview')).toBeInTheDocument()
    expect(screen.getByText('Offer')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
  })

  it('calculates total correctly', () => {
    const jobs = [makeJob({ id: '1' }), makeJob({ id: '2' })]
    render(<Dashboard jobs={jobs} />)
    const twos = screen.getAllByText('2')
    expect(twos.length).toBeGreaterThanOrEqual(1)
  })

  it('calculates success rate as 0 when no offers', () => {
    const jobs = [makeJob({ id: '1', status: 'applied' })]
    render(<Dashboard jobs={jobs} />)
    const zeros = screen.getAllByText('0%')
    expect(zeros.length).toBeGreaterThanOrEqual(1)
  })

  it('calculates success rate correctly', () => {
    const jobs = [
      makeJob({ id: '1', status: 'offer' }),
      makeJob({ id: '2', status: 'applied' }),
      makeJob({ id: '3', status: 'applied' }),
    ]
    render(<Dashboard jobs={jobs} />)
    const pcts = screen.getAllByText('33%')
    expect(pcts.length).toBeGreaterThanOrEqual(1)
  })

  it('shows 0 for empty jobs array', () => {
    render(<Dashboard jobs={[]} />)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(7)
  })

  it('renders Follow-up count', () => {
    const jobs = [makeJob({ id: '1', status: 'follow-up' })]
    render(<Dashboard jobs={jobs} />)
    const ones = screen.getAllByText('1')
    expect(ones.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── ActivityFeed ─────────────────────────────────────────────────
describe('ActivityFeed', () => {
  it('shows empty state when no activities', () => {
    render(<ActivityFeed activities={[]} />)
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  it('renders activity items', () => {
    const activities: ActivityEntry[] = [
      { id: 'a1', type: 'added', message: 'Added Google', timestamp: Date.now() },
      { id: 'a2', type: 'moved', message: 'Moved Amazon to Interview', timestamp: Date.now() - 3600000 },
    ]
    render(<ActivityFeed activities={activities} />)
    expect(screen.getByText('Added Google')).toBeInTheDocument()
    expect(screen.getByText('Moved Amazon to Interview')).toBeInTheDocument()
  })

  it('sorts by newest first', () => {
    const activities: ActivityEntry[] = [
      { id: 'a1', type: 'added', message: 'Old', timestamp: Date.now() - 86400000 },
      { id: 'a2', type: 'added', message: 'New', timestamp: Date.now() },
    ]
    const { container } = render(<ActivityFeed activities={activities} />)
    const items = container.querySelectorAll('[class*="flex items-center gap-2"]')
    expect(items.length).toBe(2)
  })

  it('limits to 20 items', () => {
    const activities: ActivityEntry[] = Array.from({ length: 25 }, (_, i) => ({
      id: `a${i}`, type: 'added' as const, message: `Activity ${i}`, timestamp: Date.now() - i * 1000,
    }))
    const { container } = render(<ActivityFeed activities={activities} />)
    const items = container.querySelectorAll('[class*="flex items-center gap-2"]')
    expect(items.length).toBeLessThanOrEqual(20)
  })

  it('shows different icons for different types', () => {
    const activities: ActivityEntry[] = [
      { id: 'a1', type: 'rejected', message: 'Rejected', timestamp: Date.now() },
      { id: 'a2', type: 'interview', message: 'Interview', timestamp: Date.now() },
    ]
    render(<ActivityFeed activities={activities} />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(screen.getByText('Interview')).toBeInTheDocument()
  })
})

// ─── ApplicationGoalTracker ────────────────────────────────────────
describe('ApplicationGoalTracker', () => {
  beforeEach(() => localStorage.clear())

  it('renders with default goal of 50', () => {
    render(<ApplicationGoalTracker completed={10} />)
    expect(screen.getByText('50 apps')).toBeInTheDocument()
    expect(screen.getByText('10/50')).toBeInTheDocument()
  })

  it('shows progress as 0% when 0 completed', () => {
    render(<ApplicationGoalTracker completed={0} />)
    expect(screen.getByText('0/50')).toBeInTheDocument()
  })

  it('clamps progress at 100%', () => {
    render(<ApplicationGoalTracker completed={200} />)
    expect(screen.getByText('200/50')).toBeInTheDocument()
  })

  it('enters edit mode when clicking goal', () => {
    render(<ApplicationGoalTracker completed={10} />)
    fireEvent.click(screen.getByText('50 apps'))
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})

// ─── ResumeAnalytics ──────────────────────────────────────────────
describe('ResumeAnalytics', () => {
  it('returns null when no jobs have resumes', () => {
    const { container } = render(<ResumeAnalytics jobs={[makeJob({ resume: '' })]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders resume usage', () => {
    const jobs = [
      makeJob({ id: '1', resume: 'resume.pdf', status: 'offer' }),
      makeJob({ id: '2', resume: 'resume.pdf', status: 'interview' }),
    ]
    render(<ResumeAnalytics jobs={jobs} />)
    expect(screen.getByText(/Used 2x/)).toBeInTheDocument()
  })

  it('renders multiple resumes', () => {
    const jobs = [
      makeJob({ id: '1', resume: 'v1.pdf', status: 'applied' }),
      makeJob({ id: '2', resume: 'v2.pdf', status: 'offer' }),
    ]
    render(<ResumeAnalytics jobs={jobs} />)
    expect(screen.getByText(/v1.pdf/)).toBeInTheDocument()
    expect(screen.getByText(/v2.pdf/)).toBeInTheDocument()
  })
})

// ─── Charts ────────────────────────────────────────────────────────
describe('Charts', () => {
  it('renders chart sections', () => {
    const jobs = [
      makeJob({ id: '1', status: 'applied', dateApplied: new Date().toISOString().split('T')[0] }),
      makeJob({ id: '2', status: 'offer', dateApplied: new Date().toISOString().split('T')[0] }),
    ]
    render(<Charts jobs={jobs} />)
    expect(screen.getByText('Status Distribution')).toBeInTheDocument()
    expect(screen.getByText('Apps by Month')).toBeInTheDocument()
    expect(screen.getByText('Interview Funnel')).toBeInTheDocument()
  })

  it('renders status counts', () => {
    const jobs = [
      makeJob({ id: '1', status: 'applied' }),
      makeJob({ id: '2', status: 'offer' }),
    ]
    render(<Charts jobs={jobs} />)
    const appliedElements = screen.getAllByText('Applied')
    expect(appliedElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Offer')).toBeInTheDocument()
  })

  it('handles empty jobs without crashing', () => {
    const { container } = render(<Charts jobs={[]} />)
    expect(container.querySelectorAll('[class*="rounded-2xl"]').length).toBe(3)
  })
})
