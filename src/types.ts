export type JobStatus =
  | 'wishlist'
  | 'applied'
  | 'follow-up'
  | 'interview'
  | 'offer'
  | 'rejected'

export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type InterviewRound = 'hr' | 'technical' | 'manager' | 'director' | 'final'
export type ApplicationSource =
  | 'linkedin'
  | 'naukri'
  | 'company_website'
  | 'referral'
  | 'indeed'
  | 'other'

export interface TimelineEntry {
  status: JobStatus
  date: string
  time: string
  timestamp: number
}

export interface Interview {
  id: string
  date: string
  time: string
  mode: 'online' | 'offline'
  meetingLink: string
  interviewerName: string
  round: InterviewRound
  notes: string
}

export interface QAFields {
  recruiterName: string
  recruiterEmail: string
  interviewMode: '' | 'online' | 'offline'
  interviewLocation: string
  expectedSalary: string
  actualOfferedSalary: string
  applicationSource: ApplicationSource
  referralName: string
  applicationId: string
  nextFollowUpDate: string
}

export interface ActivityEntry {
  id: string
  type: 'added' | 'moved' | 'edited' | 'deleted' | 'rejected' | 'interview'
  message: string
  timestamp: number
}

export interface Job {
  id: string
  company: string
  role: string
  linkedinUrl: string
  resume: string
  dateApplied: string
  salaryRange: string
  notes: string
  status: JobStatus
  priority: Priority
  timeline: TimelineEntry[]
  interviews: Interview[]
  qa: QAFields
  activities: ActivityEntry[]
  createdAt: number
  updatedAt: number
}

export type NewJob = Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'activities'>

export const STATUS_LABELS: Record<JobStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  'follow-up': 'Follow-up',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

export const STATUS_COLORS: Record<JobStatus, string> = {
  wishlist: 'border-l-blue-500',
  applied: 'border-l-yellow-500',
  'follow-up': 'border-l-purple-500',
  interview: 'border-l-orange-500',
  offer: 'border-l-green-500',
  rejected: 'border-l-red-500',
}

export const STATUS_BG_COLORS: Record<JobStatus, string> = {
  wishlist: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  applied: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  'follow-up': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  interview: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  offer: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: '🔥 Urgent',
  high: '⭐ High',
  medium: '📌 Medium',
  low: '🟢 Low',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  low: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

export const INTERVIEW_ROUND_LABELS: Record<InterviewRound, string> = {
  hr: 'HR',
  technical: 'Technical',
  manager: 'Manager',
  director: 'Director',
  final: 'Final',
}

export const APPLICATION_SOURCES: { value: ApplicationSource; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'naukri', label: 'Naukri' },
  { value: 'company_website', label: 'Company Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'other', label: 'Other' },
]

export const COLUMNS: JobStatus[] = [
  'wishlist',
  'applied',
  'follow-up',
  'interview',
  'offer',
  'rejected',
]

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function daysAgo(dateStr: string): string {
  if (!dateStr) return ''
  const then = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

export function daysBetween(dateStr: string): number {
  if (!dateStr) return Infinity
  const then = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
}

export function getApplicationHealth(dateApplied: string): { label: string; color: string; emoji: string } {
  const days = daysBetween(dateApplied)
  if (days <= 5) return { label: 'Fresh', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', emoji: '🟢' }
  if (days <= 10) return { label: 'Follow Up Recommended', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', emoji: '🟡' }
  return { label: 'Attention Required', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', emoji: '🔴' }
}

export function computeReadinessScore(job: Job): { score: number; label: string; color: string; suggestions: string[] } {
  let score = 0
  const suggestions: string[] = []

  if (job.resume) score += 15
  else suggestions.push('Upload resume')

  if (job.linkedinUrl) score += 15
  else suggestions.push('Add LinkedIn URL')

  if (job.notes) score += 10
  else suggestions.push('Add notes')

  if (job.qa.recruiterName || job.qa.recruiterEmail) score += 15
  else suggestions.push('Add recruiter details')

  if (job.salaryRange) score += 10
  else suggestions.push('Enter salary range')

  if (job.qa.nextFollowUpDate) score += 10
  else suggestions.push('Schedule follow-up')

  if (job.interviews.length > 0) score += 15
  else if (job.status === 'interview' || job.status === 'offer') suggestions.push('Add interview information')

  if (job.dateApplied) score += 10

  let label: string, color: string
  if (score >= 90) { label = 'Excellent'; color = 'bg-green-500' }
  else if (score >= 70) { label = 'Good'; color = 'bg-yellow-500' }
  else if (score >= 50) { label = 'Needs Improvement'; color = 'bg-orange-500' }
  else { label = 'Incomplete'; color = 'bg-red-500' }

  return { score, label, color, suggestions }
}

export function emptyQA(): QAFields {
  return {
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
  }
}

const COMPANY_COLORS: Record<string, string> = {}
const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#7c3aed', '#0ea5e9', '#d946ef',
]
let colorIdx = 0
export function getCompanyColor(company: string): string {
  if (!COMPANY_COLORS[company]) {
    COMPANY_COLORS[company] = COLORS[colorIdx % COLORS.length]
    colorIdx++
  }
  return COMPANY_COLORS[company]
}
