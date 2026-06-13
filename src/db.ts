import { openDB, type IDBPDatabase } from 'idb'
import type { Job } from './types'
import { emptyQA } from './types'

const DB_NAME = 'job-tracker'
const DB_VERSION = 3
const STORE_NAME = 'jobs'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('status', 'status')
        }
        if (oldVersion < 2) {
          const store = transaction.objectStore(STORE_NAME)
          if (!store.indexNames.contains('priority'))
            store.createIndex('priority', 'priority')
          if (!store.indexNames.contains('dateApplied'))
            store.createIndex('dateApplied', 'dateApplied')
        }
        if (oldVersion < 3) {
          const store = transaction.objectStore(STORE_NAME)
          if (!store.indexNames.contains('company'))
            store.createIndex('company', 'company')
        }
      },
    })
  }
  return dbPromise
}

function migrateJob(job: Record<string, unknown>): Job {
  return {
    id: job.id as string,
    company: (job.company as string) || '',
    role: (job.role as string) || '',
    linkedinUrl: (job.linkedinUrl as string) || '',
    resume: (job.resume as string) || '',
    dateApplied: (job.dateApplied as string) || '',
    salaryRange: (job.salaryRange as string) || '',
    notes: (job.notes as string) || '',
    status: (job.status as Job['status']) || 'wishlist',
    priority: (job.priority as Job['priority']) || 'medium',
    timeline: (job.timeline as Job['timeline']) || [],
    interviews: (job.interviews as Job['interviews']) || [],
    qa: (job.qa as Job['qa']) || emptyQA(),
    activities: (job.activities as Job['activities']) || [],
    createdAt: (job.createdAt as number) || Date.now(),
    updatedAt: (job.updatedAt as number) || Date.now(),
  }
}

export async function getAllJobs(): Promise<Job[]> {
  const db = await getDb()
  const raw = await db.getAll(STORE_NAME)
  return raw.map(migrateJob)
}

export async function addJob(job: Job): Promise<void> {
  const db = await getDb()
  await db.add(STORE_NAME, job)
}

export async function importJob(job: Job): Promise<void> {
  const db = await getDb()
  await db.put(STORE_NAME, job)
}

export async function updateJob(job: Job): Promise<void> {
  const db = await getDb()
  await db.put(STORE_NAME, job)
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

export async function clearAllJobs(): Promise<void> {
  const db = await getDb()
  await db.clear(STORE_NAME)
}
