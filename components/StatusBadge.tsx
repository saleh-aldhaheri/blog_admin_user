type StatusBadgeProps = {
  status: string
}

const statusStyles: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-amber-100 text-amber-700',
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-gray-100 text-gray-700',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase()
  const styles = statusStyles[normalizedStatus] || 'bg-gray-100 text-gray-700'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  )
}
