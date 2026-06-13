# Job Tracker AI

A premium, production-quality **Job Application Tracker** built with React, TypeScript, Vite, and Tailwind CSS. All data is stored locally in IndexedDB — no backend or authentication required.

## Features

- **Kanban Board** — Drag & drop jobs across 6 columns (Wishlist, Applied, Follow-up, Interview, Offer, Rejected)
- **Dashboard** — Total apps, status counts, success rates, interview rates, average days to offer/rejection
- **Charts** — Status distribution, applications by month, interview funnel
- **Priority System** — Urgent, High, Medium, Low with visual badges
- **AI Readiness Score** — Auto-calculated 0–100 score with suggestions
- **Application Health** — Fresh / Follow-up Recommended / Attention Required
- **Interview Tracking** — Date, time, mode, meeting link, interviewer, round (HR/Technical/Manager/Director/Final)
- **Status Timeline** — Complete history of status changes with dates and times
- **Activity Feed** — Recent actions across all jobs
- **Resume Analytics** — Track which resumes perform best
- **Monthly Goal Tracker** — Set and track monthly application goals
- **Company Avatars** — Auto-generated colored initials
- **Search** — By company, role, notes, priority, resume, recruiter, interviewer, source
- **Filters** — Status, priority, resume, source, date range
- **Import / Export** — JSON import and export
- **Dark Mode** — Toggle with localStorage persistence
- **Sample Data** — 15 realistic job applications pre-loaded
- **Responsive** — Works on desktop and tablet

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 8 | Build tool |
| Tailwind CSS 4 | Styling |
| IndexedDB (via `idb`) | Local persistence |
| @dnd-kit | Drag & drop |
| Vitest | Unit testing |
| Playwright | E2E testing |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Running Tests

```bash
# Unit tests
npm test

# Unit tests (watch mode)
npm run test:watch

# E2E tests (Playwright)
npx playwright test
```

## Project Structure

```
src/
├── __tests__/          # Unit tests
├── components/         # React components
│   ├── ActivityFeed.tsx
│   ├── Analytics.tsx
│   ├── ApplicationGoalTracker.tsx
│   ├── ApplicationHealth.tsx
│   ├── Charts.tsx
│   ├── CompanyAvatar.tsx
│   ├── ConfirmModal.tsx
│   ├── Dashboard.tsx
│   ├── JobCard.tsx
│   ├── JobDetailModal.tsx
│   ├── JobModal.tsx
│   ├── KanbanColumn.tsx
│   ├── ReadinessScore.tsx
│   └── ResumeAnalytics.tsx
├── db.ts               # IndexedDB operations
├── sampleData.ts       # Demo data generator
├── types.ts            # All TypeScript types
├── main.tsx            # Entry point
├── index.css           # Global CSS
└── App.tsx             # Main application
e2e/                    # Playwright E2E tests
```

## Data Model

Each job stores:
- Company, Role, LinkedIn URL, Resume, Date Applied, Salary, Notes
- Status (6 columns), Priority (4 levels)
- Timeline (complete status change history)
- Interviews (date, time, mode, link, interviewer, round)
- QA fields (recruiter, source, referral, application ID, etc.)
- Activities (audit log)
- Created/Updated timestamps

## License

MIT
