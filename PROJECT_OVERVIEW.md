# Project Overview

## What is Job Tracker AI?

Job Tracker AI is a **local-first, single-page application** for tracking job applications throughout the entire hiring pipeline. It's designed for job seekers who want a professional, data-driven way to manage their applications.

## Why This Project?

Most job trackers are either:
- Too simple (spreadsheets with no visual pipeline)
- Too complex (require signup, backend, paid subscriptions)
- Not insightful (no analytics or readiness scoring)

Job Tracker AI bridges this gap by providing a premium Trello/Linear-like experience that runs entirely in the browser with no backend.

## Key Differentiators

### 1. AI Readiness Score
Each job gets a 0–100 score based on completeness (resume, linkedin, notes, recruiter info, salary, interviews). Practical suggestions help users improve.

### 2. Application Health
Auto-calculated based on how long ago the application was sent:
- 🟢 Fresh (0-5 days)
- 🟡 Follow-up recommended (6-10 days)
- 🔴 Attention required (10+ days)

### 3. Complete Audit Trail
Every status change is recorded with date/time in the timeline. The activity feed provides a bird's-eye view of all recent actions.

### 4. Data-Driven Insights
Dashboard with success rates, interview rates, average days to offer/rejection, resume analytics, and charts showing application trends.

### 5. Interview Pipeline
Full interview tracking with rounds, mode (online/offline), meeting links, and countdown timers.

### 6. Local-First
All data stored in IndexedDB. No accounts, no servers, no privacy concerns. Data can be exported/imported as JSON.

## Architecture

```
┌─────────────────────────────────────────────┐
│                  App.tsx                      │
│  (State management, DnD context, modals)      │
├─────────────────────────────────────────────┤
│  Dashboard │ Charts │ Board │ ActivityFeed   │
├─────────────────────────────────────────────┤
│  JobCard │ KanbanColumn │ JobModal           │
│  JobDetailModal │ ConfirmModal               │
├─────────────────────────────────────────────┤
│         db.ts (IndexedDB via idb)            │
├─────────────────────────────────────────────┤
│         IndexedDB (Browser Storage)          │
└─────────────────────────────────────────────┘
```

## Data Flow

1. App loads → `getAllJobs()` → IndexedDB → state
2. No data → `generateSampleData()` → 15 sample jobs
3. User actions → update state → `updateJob()` → IndexedDB
4. Drag & drop → status change → timeline entry → persist

## Version History

| Version | Changes |
|---|---|
| v1 | Basic kanban with add/edit/delete |
| v2 | Priority, timeline, QA fields, dark mode, filters |
| v3 | Readiness score, health, interviews, activity feed, charts, company avatars, monthly goal, resume analytics |
