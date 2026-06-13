# Test Cases

## TC-001: Add Job
1. Click "+ Add Job"
2. Enter company name
3. Enter job title
4. Click "Add Job"
5. **Expected**: Card appears in Wishlist column

## TC-002: Edit Job
1. Click edit (✎) on any card
2. Change company name
3. Click "Save Changes"
4. **Expected**: Card updates with new company name

## TC-003: Delete Job
1. Click delete (✕) on any card
2. Click "Delete" in confirmation dialog
3. **Expected**: Card is removed from board

## TC-004: Drag & Drop
1. Drag a card from Wishlist to Applied column
2. **Expected**: Card moves to Applied column, status updates in IndexedDB

## TC-005: Search
1. Enter company name in search field
2. **Expected**: Only matching jobs appear

## TC-006: Filter by Status
1. Select a status from filter dropdown
2. **Expected**: Only jobs with that status appear

## TC-007: Filter by Priority
1. Select a priority from filter dropdown
2. **Expected**: Only jobs with that priority appear

## TC-008: Dark Mode
1. Click dark mode toggle
2. **Expected**: UI switches to dark theme
3. Refresh page
4. **Expected**: Dark mode persists

## TC-009: Export Jobs
1. Click "Export"
2. **Expected**: JSON file downloads

## TC-010: Import Jobs
1. Click "Import"
2. Select a valid JSON file
3. **Expected**: Jobs appear on board

## TC-011: Dashboard
1. Add/delete jobs
2. **Expected**: Dashboard stats update automatically

## TC-012: Timeline
1. Change job status
2. Open job details
3. **Expected**: Timeline shows new status entry with date/time

## TC-013: Readiness Score
1. Open job details for incomplete job
2. **Expected**: Low score with suggestions
3. Add resume, linkedin, notes
4. **Expected**: Score increases

## TC-014: Application Health
1. Check card with date applied within 5 days
2. **Expected**: Shows 🟢 Fresh
3. Check card with date applied 8 days ago
4. **Expected**: Shows 🟡 Follow Up Recommended

## TC-015: Interview Tracking
1. Open add/edit modal
2. Add interview details (date, time, round, mode)
3. **Expected**: Interview appears in detail view

## TC-016: Monthly Goal
1. Click goal number in Monthly Goal widget
2. Set to 30
3. **Expected**: Progress bar updates

## TC-017: Company Avatar
1. **Expected**: Each card shows colored circle with first letter

## TC-018: Charts
1. **Expected**: Status distribution bar chart displays
2. **Expected**: Applications by month chart displays
3. **Expected**: Interview funnel displays
