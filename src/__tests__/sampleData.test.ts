import { describe, it, expect } from 'vitest'
import { generateSampleData } from '../sampleData'
import { COLUMNS } from '../types'

describe('generateSampleData', () => {
  it('generates 25 jobs', () => {
    const data = generateSampleData()
    expect(data).toHaveLength(25)
  })

  it('generates all required fields', () => {
    const data = generateSampleData()
    for (const job of data) {
      expect(job.id).toBeTruthy()
      expect(job.company).toBeTruthy()
      expect(job.role).toBeTruthy()
      expect(job.status).toBeTruthy()
      expect(job.priority).toBeTruthy()
      expect(job.createdAt).toBeGreaterThan(0)
      expect(job.updatedAt).toBeGreaterThan(0)
    }
  })

  it('generates valid statuses', () => {
    const data = generateSampleData()
    for (const job of data) {
      expect(COLUMNS).toContain(job.status)
    }
  })

  it('distributes statuses across all 6 columns', () => {
    const data = generateSampleData()
    const statuses = new Set(data.map(j => j.status))
    expect(statuses.size).toBe(6)
  })

  it('generates 25 unique company names', () => {
    const data = generateSampleData()
    const companies = data.map(j => j.company)
    const unique = new Set(companies)
    expect(unique.size).toBe(25)
  })

  it('generates valid timeline arrays', () => {
    const data = generateSampleData()
    for (const job of data) {
      expect(Array.isArray(job.timeline)).toBe(true)
      expect(job.timeline.length).toBeGreaterThanOrEqual(1)
      for (const entry of job.timeline) {
        expect(entry.status).toBeTruthy()
        expect(entry.date).toBeTruthy()
        expect(entry.time).toBeTruthy()
        expect(entry.timestamp).toBeGreaterThan(0)
      }
    }
  })

  it('generates activities', () => {
    const data = generateSampleData()
    for (const job of data) {
      expect(job.activities.length).toBeGreaterThanOrEqual(1)
      expect(job.activities[0].type).toBe('added')
    }
  })

  it('generates QA fields', () => {
    const data = generateSampleData()
    for (const job of data) {
      expect(job.qa.recruiterName).toBeTruthy()
      expect(job.qa.applicationSource).toBeTruthy()
    }
  })

  it('generates salary ranges', () => {
    const data = generateSampleData()
    for (const job of data) {
      expect(job.salaryRange).toContain('$')
      expect(job.salaryRange).toContain('k')
    }
  })

  it('generates interviews for interview/offer status jobs', () => {
    const data = generateSampleData()
    for (const job of data) {
      if (job.status === 'interview' || job.status === 'offer') {
        expect(job.interviews.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('generates LinkedIn URLs', () => {
    const data = generateSampleData()
    for (const job of data) {
      expect(job.linkedinUrl).toContain('linkedin.com')
    }
  })
})
