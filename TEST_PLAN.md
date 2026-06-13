# Test Plan

## 1. Unit Tests (Vitest)

### Location: `src/__tests__/`

### Types Tests (`types.test.ts`)
- `formatDate` — correct formatting, empty input
- `formatTime` — timestamp formatting
- `daysAgo` — Today, 1 day ago, X days ago
- `daysBetween` — 0 for today, positive for past
- `getApplicationHealth` — Fresh (≤5d), Follow-up (6-10d), Attention (10+d)
- `computeReadinessScore` — Low for empty, medium for partial, excellent for complete
- Status labels — 6 statuses exist
- Priority labels — 4 priorities exist

### Component Tests (`components.test.tsx`)
- ConfirmModal — renders, onConfirm called, onCancel called
- CompanyAvatar — renders first letter, renders ? for empty
- ApplicationHealth — null without date, renders for today
- ReadinessScore — renders score, shows Excellent for complete job

## 2. E2E Tests (Playwright)

### Location: `e2e/app.spec.ts`

- Load application with sample data
- Dashboard stats visible
- Add job modal open/close
- Create new job
- Kanban columns visible
- Search filters
- Dark mode toggle
- Export button visibility
- Analytics section visibility

## 3. Manual Testing Checklist

### Core Features
- [ ] Drag & drop cards between columns
- [ ] Add job with all fields
- [ ] Edit job
- [ ] Delete job with confirmation
- [ ] Search by company, role, recruiter, interviewer
- [ ] Filter by status, priority, resume, source, date range
- [ ] Sort by date

### Premium Features
- [ ] Dashboard stats update on job changes
- [ ] AI Readiness Score shows on detail modal
- [ ] Application Health badges display correctly
- [ ] Status timeline records history
- [ ] Interview tracking add/edit/delete
- [ ] Activity feed shows recent actions
- [ ] Resume analytics display
- [ ] Monthly goal tracking with progress bar
- [ ] Charts (status distribution, monthly apps, funnel)
- [ ] Company avatars with colored initials

### Data
- [ ] Import JSON works
- [ ] Export JSON downloads correctly
- [ ] Dark mode persists across refresh
- [ ] Sample data loads on first visit
- [ ] IndexedDB migration from v1/v2 to v3

### UI/UX
- [ ] Sticky header stays at top
- [ ] Columns scroll independently
- [ ] Responsive layout
- [ ] Smooth animations and transitions
- [ ] Empty states display correctly
