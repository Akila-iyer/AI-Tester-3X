import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatTime,
  daysAgo,
  daysBetween,
  getApplicationHealth,
  computeReadinessScore,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_BG_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  COLUMNS,
  emptyQA,
  getCompanyColor,
  APPLICATION_SOURCES,
  INTERVIEW_ROUND_LABELS,
} from '../types'
import type { Job, JobStatus } from '../types'

// ─── formatDate ───────────────────────────────────────────────────
describe('formatDate', () => {
  it('formats date string correctly', () => {
    const result = formatDate('2026-06-13')
    expect(result).toContain('Jun')
    expect(result).toContain('2026')
  })

  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })

  it('formats date with single-digit day', () => {
    const result = formatDate('2026-01-05')
    expect(result).toContain('Jan')
  })

  it('formats December date', () => {
    const result = formatDate('2026-12-25')
    expect(result).toContain('Dec')
  })
})

// ─── formatTime ───────────────────────────────────────────────────
describe('formatTime', () => {
  it('formats timestamp correctly', () => {
    const ts = new Date('2026-06-13T10:30:00').getTime()
    const result = formatTime(ts)
    expect(result).toContain('10')
    expect(result).toContain('30')
  })

  it('formats PM time', () => {
    const ts = new Date('2026-06-13T15:45:00').getTime()
    const result = formatTime(ts)
    expect(result).toContain('45')
    expect(result).toMatch(/03|PM/)
  })

  it('formats midnight', () => {
    const ts = new Date('2026-06-13T00:00:00').getTime()
    const result = formatTime(ts)
    expect(result).toContain('12')
  })
})

// ─── daysAgo ──────────────────────────────────────────────────────
describe('daysAgo', () => {
  it('returns empty string for empty input', () => {
    expect(daysAgo('')).toBe('')
  })

  it('returns Today for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(daysAgo(today)).toBe('Today')
  })

  it('returns 1 day ago for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    expect(daysAgo(yesterday)).toBe('1 day ago')
  })

  it('returns X days ago for past dates', () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
    expect(daysAgo(past)).toBe('5 days ago')
  })

  it('handles 30+ days ago', () => {
    const past = new Date(Date.now() - 32 * 86400000).toISOString().split('T')[0]
    expect(daysAgo(past)).toBe('32 days ago')
  })
})

// ─── daysBetween ──────────────────────────────────────────────────
describe('daysBetween', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(daysBetween(today)).toBe(0)
  })

  it('returns positive for past dates', () => {
    const past = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
    expect(daysBetween(past)).toBe(3)
  })

  it('returns Infinity for empty string', () => {
    expect(daysBetween('')).toBe(Infinity)
  })
})

// ─── getApplicationHealth ─────────────────────────────────────────
describe('getApplicationHealth', () => {
  it('returns Fresh for 0 days', () => {
    const today = new Date().toISOString().split('T')[0]
    const h = getApplicationHealth(today)
    expect(h.label).toBe('Fresh')
    expect(h.emoji).toBe('🟢')
    expect(h.color).toContain('green')
  })

  it('returns Fresh for ≤5 days', () => {
    const recent = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const h = getApplicationHealth(recent)
    expect(h.label).toBe('Fresh')
    expect(h.emoji).toBe('🟢')
  })

  it('returns Fresh at exactly 5 days', () => {
    const day5 = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
    const h = getApplicationHealth(day5)
    expect(h.label).toBe('Fresh')
  })

  it('returns Follow Up Recommended for 6-10 days', () => {
    const mid = new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0]
    const h = getApplicationHealth(mid)
    expect(h.label).toBe('Follow Up Recommended')
    expect(h.emoji).toBe('🟡')
  })

  it('returns Follow Up at exactly 6 days', () => {
    const day6 = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
    const h = getApplicationHealth(day6)
    expect(h.label).toBe('Follow Up Recommended')
  })

  it('returns Follow Up at exactly 10 days', () => {
    const day10 = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0]
    const h = getApplicationHealth(day10)
    expect(h.label).toBe('Follow Up Recommended')
  })

  it('returns Attention Required for 10+ days', () => {
    const old = new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]
    const h = getApplicationHealth(old)
    expect(h.label).toBe('Attention Required')
    expect(h.emoji).toBe('🔴')
  })

  it('returns Attention for 11 days', () => {
    const day11 = new Date(Date.now() - 11 * 86400000).toISOString().split('T')[0]
    const h = getApplicationHealth(day11)
    expect(h.label).toBe('Attention Required')
  })
})

// ─── computeReadinessScore ────────────────────────────────────────
function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '1', company: 'Test', role: 'QA', linkedinUrl: '', resume: '',
    dateApplied: '', salaryRange: '', notes: '', status: 'wishlist',
    priority: 'medium', timeline: [], interviews: [],
    qa: { recruiterName: '', recruiterEmail: '', interviewMode: '', interviewLocation: '', expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '' },
    activities: [], createdAt: Date.now(), updatedAt: Date.now(), ...overrides,
  }
}

describe('computeReadinessScore', () => {
  it('returns low score for completely empty job', () => {
    const result = computeReadinessScore(makeJob())
    expect(result.score).toBeLessThan(50)
    expect(result.label).toBe('Incomplete')
    expect(result.color).toBe('bg-red-500')
    expect(result.suggestions.length).toBeGreaterThanOrEqual(4)
  })

  it('returns score 15 when only resume is present', () => {
    const result = computeReadinessScore(makeJob({ resume: 'r.pdf' }))
    expect(result.score).toBeGreaterThanOrEqual(15)
    expect(result.suggestions).toContain('Add LinkedIn URL')
  })

  it('returns score 30 when resume + linkedin are present', () => {
    const result = computeReadinessScore(makeJob({ resume: 'r.pdf', linkedinUrl: 'https://ln' }))
    expect(result.score).toBeGreaterThanOrEqual(30)
  })

  it('returns needs improvement at exactly 50', () => {
    const result = computeReadinessScore(makeJob({
      resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n', dateApplied: '2026-01-01',
    }))
    expect(result.score).toBeGreaterThanOrEqual(50)
    expect(result.score).toBeLessThan(70)
    expect(result.label).toBe('Needs Improvement')
    expect(result.color).toBe('bg-orange-500')
  })

  it('returns Good at 70+', () => {
    const result = computeReadinessScore(makeJob({
      resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n', salaryRange: '$100k', dateApplied: '2026-01-01',
      qa: { recruiterName: 'John', recruiterEmail: 'j@t.com', interviewMode: '', interviewLocation: '', expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '2026-07-01' },
    }))
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.score).toBeLessThan(90)
    expect(result.label).toBe('Good')
    expect(result.color).toBe('bg-yellow-500')
  })

  it('returns Excellent for fully complete job', () => {
    const result = computeReadinessScore(makeJob({
      resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n', salaryRange: '$100k', dateApplied: '2026-06-01',
      interviews: [{ id: 'i1', date: '2026-07-01', time: '10:00', mode: 'online', meetingLink: '', interviewerName: 'Jane', round: 'technical', notes: '' }],
      qa: { recruiterName: 'John', recruiterEmail: 'j@t.com', interviewMode: '', interviewLocation: '', expectedSalary: '$100k', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '2026-07-01' },
    }))
    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.label).toBe('Excellent')
    expect(result.color).toBe('bg-green-500')
    expect(result.suggestions).toHaveLength(0)
  })

  it('suggests "Upload resume" when missing', () => {
    const result = computeReadinessScore(makeJob())
    expect(result.suggestions).toContain('Upload resume')
  })

  it('suggests "Add LinkedIn URL" when missing', () => {
    const result = computeReadinessScore(makeJob({ resume: 'r.pdf' }))
    expect(result.suggestions).toContain('Add LinkedIn URL')
  })

  it('suggests "Add notes" when missing', () => {
    const result = computeReadinessScore(makeJob({ resume: 'r.pdf', linkedinUrl: 'https://ln' }))
    expect(result.suggestions).toContain('Add notes')
  })

  it('suggests "Add recruiter details" when missing', () => {
    const result = computeReadinessScore(makeJob({ resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n' }))
    expect(result.suggestions).toContain('Add recruiter details')
  })

  it('suggests "Enter salary range" when missing', () => {
    const result = computeReadinessScore(makeJob({
      resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n',
      qa: { recruiterName: 'J', recruiterEmail: 'j@t.com', interviewMode: '', interviewLocation: '', expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '' },
    }))
    expect(result.suggestions).toContain('Enter salary range')
  })

  it('suggests "Schedule follow-up" when nextFollowUpDate is missing', () => {
    const result = computeReadinessScore(makeJob({
      resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n', salaryRange: '$100k',
      qa: { recruiterName: 'J', recruiterEmail: 'j@t.com', interviewMode: '', interviewLocation: '', expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '' },
      dateApplied: '2026-01-01',
    }))
    expect(result.suggestions).toContain('Schedule follow-up')
  })

  it('suggests "Add interview information" when in interview/offer status but no interviews', () => {
    const result = computeReadinessScore(makeJob({
      status: 'interview', resume: 'r.pdf', linkedinUrl: 'https://ln', notes: 'n', salaryRange: '$100k',
      qa: { recruiterName: 'J', recruiterEmail: 'j@t.com', interviewMode: '', interviewLocation: '', expectedSalary: '', actualOfferedSalary: '', applicationSource: 'linkedin', referralName: '', applicationId: '', nextFollowUpDate: '2026-07-01' },
      dateApplied: '2026-01-01', interviews: [],
    }))
    expect(result.suggestions).toContain('Add interview information')
  })
})

// ─── Status constants ─────────────────────────────────────────────
describe('STATUS_LABELS', () => {
  it('has all 6 statuses', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(6)
  })

  it('has label for each status', () => {
    const statuses: JobStatus[] = ['wishlist', 'applied', 'follow-up', 'interview', 'offer', 'rejected']
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeTruthy()
    }
  })

  it('has correct labels', () => {
    expect(STATUS_LABELS.wishlist).toBe('Wishlist')
    expect(STATUS_LABELS.offer).toBe('Offer')
    expect(STATUS_LABELS.rejected).toBe('Rejected')
  })
})

describe('STATUS_COLORS', () => {
  it('has all 6 statuses', () => {
    expect(Object.keys(STATUS_COLORS)).toHaveLength(6)
  })

  it('contains border-l classes', () => {
    expect(STATUS_COLORS.wishlist).toContain('border-l')
  })
})

describe('STATUS_BG_COLORS', () => {
  it('has all 6 statuses', () => {
    expect(Object.keys(STATUS_BG_COLORS)).toHaveLength(6)
  })

  it('contains bg- classes', () => {
    expect(STATUS_BG_COLORS.applied).toContain('bg-')
  })
})

describe('COLUMNS', () => {
  it('has exactly 6 columns', () => {
    expect(COLUMNS).toHaveLength(6)
  })

  it('has correct order', () => {
    expect(COLUMNS[0]).toBe('wishlist')
    expect(COLUMNS[1]).toBe('applied')
    expect(COLUMNS[2]).toBe('follow-up')
    expect(COLUMNS[3]).toBe('interview')
    expect(COLUMNS[4]).toBe('offer')
    expect(COLUMNS[5]).toBe('rejected')
  })
})

// ─── Priority constants ────────────────────────────────────────────
describe('PRIORITY_LABELS', () => {
  it('has all 4 priorities', () => {
    expect(Object.keys(PRIORITY_LABELS)).toHaveLength(4)
  })

  it('has correct labels', () => {
    expect(PRIORITY_LABELS.urgent).toContain('Urgent')
    expect(PRIORITY_LABELS.high).toContain('High')
    expect(PRIORITY_LABELS.medium).toContain('Medium')
    expect(PRIORITY_LABELS.low).toContain('Low')
  })
})

describe('PRIORITY_COLORS', () => {
  it('has all 4 priorities', () => {
    expect(Object.keys(PRIORITY_COLORS)).toHaveLength(4)
  })

  it('contains bg- classes', () => {
    expect(PRIORITY_COLORS.urgent).toContain('bg-')
    expect(PRIORITY_COLORS.low).toContain('bg-')
  })
})

// ─── INTERVIEW_ROUND_LABELS ────────────────────────────────────────
describe('INTERVIEW_ROUND_LABELS', () => {
  it('has all 5 rounds', () => {
    expect(Object.keys(INTERVIEW_ROUND_LABELS)).toHaveLength(5)
  })

  it('has correct labels', () => {
    expect(INTERVIEW_ROUND_LABELS.hr).toBe('HR')
    expect(INTERVIEW_ROUND_LABELS.technical).toBe('Technical')
    expect(INTERVIEW_ROUND_LABELS.manager).toBe('Manager')
    expect(INTERVIEW_ROUND_LABELS.director).toBe('Director')
    expect(INTERVIEW_ROUND_LABELS.final).toBe('Final')
  })
})

// ─── APPLICATION_SOURCES ───────────────────────────────────────────
describe('APPLICATION_SOURCES', () => {
  it('has all 6 sources', () => {
    expect(APPLICATION_SOURCES).toHaveLength(6)
  })

  it('includes LinkedIn and Naukri', () => {
    const values = APPLICATION_SOURCES.map(s => s.value)
    expect(values).toContain('linkedin')
    expect(values).toContain('naukri')
    expect(values).toContain('company_website')
    expect(values).toContain('referral')
  })
})

// ─── emptyQA ──────────────────────────────────────────────────────
describe('emptyQA', () => {
  it('returns all empty fields', () => {
    const qa = emptyQA()
    expect(qa.recruiterName).toBe('')
    expect(qa.recruiterEmail).toBe('')
    expect(qa.interviewMode).toBe('')
    expect(qa.applicationSource).toBe('linkedin')
    expect(qa.referralName).toBe('')
    expect(qa.applicationId).toBe('')
    expect(qa.nextFollowUpDate).toBe('')
  })
})

// ─── getCompanyColor ──────────────────────────────────────────────
describe('getCompanyColor', () => {
  it('returns a color string', () => {
    const color = getCompanyColor('Google')
    expect(color).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('returns same color for same company', () => {
    const c1 = getCompanyColor('TestCorp')
    const c2 = getCompanyColor('TestCorp')
    expect(c1).toBe(c2)
  })

  it('returns different colors for different companies', () => {
    const c1 = getCompanyColor('Alpha')
    const c2 = getCompanyColor('Beta')
    expect(c1).not.toBe(c2)
  })
})
