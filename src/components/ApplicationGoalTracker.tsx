import { useState, useEffect } from 'react'

const STORAGE_KEY = 'job-tracker-goal'

interface Props { completed: number }

export default function ApplicationGoalTracker({ completed }: Props) {
  const [goal, setGoal] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored, 10) : 50
  })
  const [editing, setEditing] = useState(false)
  const [tempGoal, setTempGoal] = useState(goal)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(goal)) }, [goal])

  const progress = Math.min(completed / goal, 1)
  const pct = Math.round(progress * 100)

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">📈 Monthly Goal</span>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input type="number" min={1} max={500} className="w-16 px-1.5 py-1 text-xs rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]" value={tempGoal} onChange={e => setTempGoal(parseInt(e.target.value) || 1)} />
            <button onClick={() => { setGoal(tempGoal); setEditing(false) }} className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-lg cursor-pointer font-medium">Save</button>
            <button onClick={() => { setTempGoal(goal); setEditing(false) }} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:hover:text-[var(--color-text-primary-dark)] cursor-pointer">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs text-blue-500 hover:text-blue-600 font-semibold cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg">{goal} apps</button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] whitespace-nowrap">{completed}/{goal}</span>
      </div>
    </div>
  )
}
