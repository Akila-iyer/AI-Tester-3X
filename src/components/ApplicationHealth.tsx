import { getApplicationHealth } from '../types'

interface Props {
  dateApplied: string
}

export default function ApplicationHealth({ dateApplied }: Props) {
  if (!dateApplied) return null
  const health = getApplicationHealth(dateApplied)

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${health.color}`}>
      {health.emoji} {health.label}
    </span>
  )
}
