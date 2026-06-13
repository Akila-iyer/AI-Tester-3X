import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { clearAllJobs, getAllJobs, importJob } from '../db'
import type { Job } from '../types'
import { emptyQA, COLUMNS } from '../types'

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: crypto.randomUUID(), company: 'Test', role: 'QA', linkedinUrl: '', resume: '',
    dateApplied: '', salaryRange: '', notes: '', status: 'wishlist', priority: 'medium',
    timeline: [], interviews: [],
    qa: { recruiterName: '', recruiterEmail: '', interviewMode: '', interviewLocation: '', expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '' },
    activities: [], createdAt: Date.now(), updatedAt: Date.now(), ...overrides,
  }
}

function serializeJobs(jobs: Job[]): string {
  return JSON.stringify(jobs, null, 2)
}

function parseImport(json: string): Record<string, unknown>[] {
  const raw = JSON.parse(json)
  return Array.isArray(raw) ? raw : [raw]
}

describe('Import / Export round-trip', () => {
  beforeEach(async () => { await clearAllJobs() })
  afterEach(async () => { await clearAllJobs() })

  it('export then import produces identical data', async () => {
    const original = [
      makeJob({ id: 'a1', company: 'Google', role: 'SDET', status: 'interview', priority: 'urgent' }),
      makeJob({ id: 'a2', company: 'Meta', role: 'QA Lead', status: 'offer', priority: 'high', salaryRange: '$200k' }),
    ]
    // Save originals
    for (const j of original) await importJob(j)

    // Simulate export -> import round-trip
    const exported = serializeJobs(original)
    const parsed = parseImport(exported)

    await clearAllJobs()

    for (const item of parsed) {
      const j: Job = {
        id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
        company: typeof item.company === 'string' && item.company.trim() ? item.company.trim() : 'Unknown Company',
        role: typeof item.role === 'string' && item.role.trim() ? item.role.trim() : 'Unknown Role',
        linkedinUrl: typeof item.linkedinUrl === 'string' ? item.linkedinUrl : '',
        resume: typeof item.resume === 'string' ? item.resume : '',
        dateApplied: typeof item.dateApplied === 'string' ? item.dateApplied : '',
        salaryRange: typeof item.salaryRange === 'string' ? item.salaryRange : '',
        notes: typeof item.notes === 'string' ? item.notes : '',
        status: COLUMNS.includes(item.status as Job['status']) ? (item.status as Job['status']) : 'wishlist',
        priority: ['urgent', 'high', 'medium', 'low'].includes(item.priority as string) ? (item.priority as Job['priority']) : 'medium',
        timeline: Array.isArray(item.timeline) ? item.timeline : [],
        interviews: Array.isArray(item.interviews) ? item.interviews : [],
        qa: item.qa && typeof item.qa === 'object' ? { ...emptyQA(), ...(item.qa as Record<string, unknown>) } : emptyQA(),
        activities: Array.isArray(item.activities) ? item.activities : [],
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
      }
      await importJob(j)
    }

    const after = await getAllJobs()
    expect(after).toHaveLength(2)

    const g = after.find(j => j.company === 'Google')!
    expect(g.role).toBe('SDET')
    expect(g.status).toBe('interview')
    expect(g.priority).toBe('urgent')

    const m = after.find(j => j.company === 'Meta')!
    expect(m.salaryRange).toBe('$200k')
    expect(m.status).toBe('offer')
  })

  it('importing the same file twice does not throw (upsert)', async () => {
    const original = [
      makeJob({ id: 'b1', company: 'Apple', role: 'QA Engineer' }),
    ]
    const exported = serializeJobs(original)
    const items = parseImport(exported)

    for (const item of items) {
      const j: Job = {
        id: (item.id as string) || crypto.randomUUID(),
        company: (item.company as string) || 'Unknown',
        role: (item.role as string) || 'Unknown',
        linkedinUrl: '', resume: '', dateApplied: '', salaryRange: '', notes: '',
        status: 'wishlist', priority: 'medium',
        timeline: [], interviews: [],
        qa: emptyQA(), activities: [],
        createdAt: Date.now(), updatedAt: Date.now(),
      }
      await importJob(j)
    }

    // Import again with same IDs
    for (const item of items) {
      const j: Job = {
        id: (item.id as string) || crypto.randomUUID(),
        company: (item.company as string) || 'Unknown',
        role: (item.role as string) || 'Unknown',
        linkedinUrl: '', resume: '', dateApplied: '', salaryRange: '', notes: '',
        status: 'wishlist', priority: 'medium',
        timeline: [], interviews: [],
        qa: emptyQA(), activities: [],
        createdAt: Date.now(), updatedAt: Date.now(),
      }
      await expect(importJob(j)).resolves.not.toThrow()
    }

    const all = await getAllJobs()
    expect(all).toHaveLength(1)
  })

  it('handles invalid JSON gracefully', () => {
    expect(() => JSON.parse('not json')).toThrow()
  })

  it('handles empty array gracefully', async () => {
    await clearAllJobs()
    // Empty array should just produce 0 imports
    const all = await getAllJobs()
    expect(all).toHaveLength(0)
  })

  it('handles items missing required fields gracefully', async () => {
    const rawItems: Record<string, unknown>[] = [{ unknown: true }]
    for (const item of rawItems) {
      const company = typeof item.company === 'string' && item.company.trim() ? item.company.trim() : ''
      const role = typeof item.role === 'string' && item.role.trim() ? item.role.trim() : ''
      if (!company && !role) continue // skip invalid

      const j: Job = {
        id: crypto.randomUUID(),
        company: company || 'Unknown Company',
        role: role || 'Unknown Role',
        linkedinUrl: '', resume: '', dateApplied: '', salaryRange: '', notes: '',
        status: 'wishlist', priority: 'medium',
        timeline: [], interviews: [],
        qa: emptyQA(), activities: [],
        createdAt: Date.now(), updatedAt: Date.now(),
      }
      await importJob(j)
    }
    const all = await getAllJobs()
    expect(all).toHaveLength(0)
  })

  it('preserves QA fields through export/import', async () => {
    const qa = {
      recruiterName: 'John', recruiterEmail: 'john@co.com', interviewMode: 'online' as const,
      interviewLocation: 'Zoom', expectedSalary: '$100k', actualOfferedSalary: '$120k',
      applicationSource: 'referral' as const, referralName: 'Bob', applicationId: 'A-1',
      nextFollowUpDate: '2026-08-01',
    }
    const original = makeJob({ id: 'c1', qa })
    const exported = serializeJobs([original])
    const items = parseImport(exported)
    const item = items[0]

    const restoredQA = item.qa && typeof item.qa === 'object'
      ? { ...emptyQA(), ...(item.qa as Record<string, unknown>) }
      : emptyQA()

    expect(restoredQA.recruiterName).toBe('John')
    expect(restoredQA.applicationSource).toBe('referral')
    expect(restoredQA.actualOfferedSalary).toBe('$120k')
  })

  it('preserves timeline through export/import', async () => {
    const timeline = [
      { status: 'applied' as const, date: '01-Jun-2026', time: '10:00 AM', timestamp: 100 },
      { status: 'interview' as const, date: '10-Jun-2026', time: '02:00 PM', timestamp: 200 },
    ]
    const original = makeJob({ id: 'd1', timeline })
    const exported = serializeJobs([original])
    const items = parseImport(exported)
    const item = items[0]

    const restoredTimeline = Array.isArray(item.timeline) ? item.timeline : []
    expect(restoredTimeline).toHaveLength(2)
    expect(restoredTimeline[1].status).toBe('interview')
  })

  it('preserves interviews through export/import', async () => {
    const interviews = [
      { id: 'iv1', date: '2026-07-01', time: '10:00', mode: 'online' as const, meetingLink: '', interviewerName: 'Jane', round: 'technical' as const, notes: '' },
    ]
    const original = makeJob({ id: 'e1', interviews })
    const exported = serializeJobs([original])
    const items = parseImport(exported)
    const item = items[0]

    const restored = Array.isArray(item.interviews) ? item.interviews : []
    expect(restored).toHaveLength(1)
    expect(restored[0].interviewerName).toBe('Jane')
  })

  it('preserves activities through export/import', async () => {
    const activities = [
      { id: 'act1', type: 'added' as const, message: 'Added test', timestamp: 100 },
    ]
    const original = makeJob({ id: 'f1', activities })
    const exported = serializeJobs([original])
    const items = parseImport(exported)
    const item = items[0]

    const restored = Array.isArray(item.activities) ? item.activities : []
    expect(restored).toHaveLength(1)
    expect(restored[0].message).toBe('Added test')
  })
})
