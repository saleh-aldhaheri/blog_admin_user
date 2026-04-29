type AvatarCircleProps = {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function AvatarCircle({ src, name, size = 'md' }: AvatarCircleProps) {
  const initials = getInitials(name)
  const classes = sizeClasses[size]

  if (src && src !== '') {
    return (
      <img
        src={src}
        alt={name}
        className={`${classes} rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      className={`${classes} flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground`}
    >
      {initials}
    </div>
  )
}
