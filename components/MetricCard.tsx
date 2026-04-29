type MetricCardProps = {
  label: string
  value: number | string
  icon?: React.ReactNode
}

export function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold text-card-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}
