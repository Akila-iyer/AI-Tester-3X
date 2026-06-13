import type { Job } from '../types'
import { computeReadinessScore } from '../types'

interface Props {
  job: Job
}

export default function ReadinessScore({ job }: Props) {
  const { score, label, color } = computeReadinessScore(job)

  let textColor = ''
  if (score >= 90) textColor = 'text-green-600 dark:text-green-400'
  else if (score >= 70) textColor = 'text-yellow-600 dark:text-yellow-400'
  else if (score >= 50) textColor = 'text-orange-600 dark:text-orange-400'
  else textColor = 'text-red-600 dark:text-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-semibold whitespace-nowrap ${textColor}`}>
        {score}/100 {label}
      </span>
    </div>
  )
}
