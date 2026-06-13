interface Props {
  children: React.ReactNode
}

export default function ColumnContainer({ children }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto px-6 pb-6 flex-1 min-h-0">
      {children}
    </div>
  )
}
