import { useEffect, useRef } from 'react'

interface Props {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ title, message, onConfirm, onCancel }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-sm mx-4 animate-fade-in">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">Cancel</button>
          <button ref={confirmRef} onClick={onConfirm} className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm cursor-pointer">Delete</button>
        </div>
      </div>
    </div>
  )
}
