import { getCompanyColor } from '../types'

interface Props {
  company: string
  size?: 'sm' | 'md' | 'lg'
}

export default function CompanyAvatar({ company, size = 'sm' }: Props) {
  const firstLetter = company.trim().charAt(0).toUpperCase() || '?'
  const bgColor = getCompanyColor(company)

  const sizeMap = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-xl' }

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: bgColor }}
      title={company}
    >
      {firstLetter}
    </div>
  )
}
