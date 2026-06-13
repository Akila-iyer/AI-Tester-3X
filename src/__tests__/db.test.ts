import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAllJobs, addJob, updateJob, deleteJob, clearAllJobs } from '../db'
import type { Job } from '../types'

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: crypto.randomUUID(),
    company: 'Test',
    role: 'QA',
    linkedinUrl: '',
    resume: '',
    dateApplied: '',
    salaryRange: '',
    notes: '',
    status: 'wishlist',
    priority: 'medium',
    timeline: [],
    interviews: [],
    qa: {
      recruiterName: '', recruiterEmail: '', interviewMode: '', interviewLocation: '',
      expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin',
      referralName: '', applicationId: '', nextFollowUpDate: '',
    },
    activities: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('IndexedDB database operations', () => {
  beforeEach(async () => {
    await clearAllJobs()
  })

  afterEach(async () => {
    await clearAllJobs()
  })

  it('adds a job and retrieves it', async () => {
    const job = makeJob({ company: 'Google', role: 'SDET' })
    await addJob(job)
    const all = await getAllJobs()
    expect(all).toHaveLength(1)
    expect(all[0].company).toBe('Google')
    expect(all[0].role).toBe('SDET')
  })

  it('adds multiple jobs and retrieves all', async () => {
    await addJob(makeJob({ id: '1', company: 'Google' }))
    await addJob(makeJob({ id: '2', company: 'Amazon' }))
    const all = await getAllJobs()
    expect(all).toHaveLength(2)
  })

  it('updates an existing job', async () => {
    const job = makeJob({ id: '1', company: 'Google', status: 'applied' })
    await addJob(job)
    const updated = { ...job, company: 'Google Updated', status: 'interview' as const }
    await updateJob(updated)
    const all = await getAllJobs()
    expect(all).toHaveLength(1)
    expect(all[0].company).toBe('Google Updated')
    expect(all[0].status).toBe('interview')
  })

  it('deletes a job', async () => {
    await addJob(makeJob({ id: '1', company: 'ToDelete' }))
    await addJob(makeJob({ id: '2', company: 'Keep' }))
    await deleteJob('1')
    const all = await getAllJobs()
    expect(all).toHaveLength(1)
    expect(all[0].company).toBe('Keep')
  })

  it('clears all jobs', async () => {
    await addJob(makeJob({ id: '1' }))
    await addJob(makeJob({ id: '2' }))
    await clearAllJobs()
    const all = await getAllJobs()
    expect(all).toHaveLength(0)
  })

  it('preserves timeline data across add/get', async () => {
    const timeline = [
      { status: 'applied' as const, date: '13-May-2026', time: '10:00 AM', timestamp: 1000 },
      { status: 'interview' as const, date: '20-May-2026', time: '02:00 PM', timestamp: 2000 },
    ]
    const job = makeJob({ id: '1', timeline })
    await addJob(job)
    const all = await getAllJobs()
    expect(all[0].timeline).toHaveLength(2)
    expect(all[0].timeline[1].status).toBe('interview')
  })

  it('preserves interview data', async () => {
    const interviews = [{ id: 'iv1', date: '2026-07-01', time: '10:00', mode: 'online' as const, meetingLink: '', interviewerName: 'John', round: 'technical' as const, notes: '' }]
    const job = makeJob({ id: '1', interviews })
    await addJob(job)
    const all = await getAllJobs()
    expect(all[0].interviews).toHaveLength(1)
    expect(all[0].interviews[0].interviewerName).toBe('John')
  })

  it('preserves QA fields', async () => {
    const job = makeJob({
      id: '1',
      qa: { recruiterName: 'Sarah', recruiterEmail: 'sarah@co.com', interviewMode: 'online', interviewLocation: 'Zoom', expectedSalary: '$100k', actualOfferedSalary: '$120k', applicationSource: 'referral', referralName: 'Bob', applicationId: 'APP-001', nextFollowUpDate: '2026-08-01' },
    })
    await addJob(job)
    const all = await getAllJobs()
    expect(all[0].qa.recruiterName).toBe('Sarah')
    expect(all[0].qa.applicationSource).toBe('referral')
  })

  it('migrates old data with missing priority field', async () => {
    const job = makeJob({ id: '1', company: 'Old' })
    const { priority, ...rest } = job
    await addJob({ ...rest, priority: undefined as unknown as 'medium' } as Job)
    const all = await getAllJobs()
    expect(all[0].priority).toBe('medium')
  })
})
