import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  prevCursor: string | null
  nextCursor: string | null
  onPrev: () => void
  onNext: () => void
  isLoading?: boolean
}

export function Pagination({
  prevCursor,
  nextCursor,
  onPrev,
  onNext,
  isLoading = false,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onPrev}
        disabled={!prevCursor || isLoading}
        className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <button
        onClick={onNext}
        disabled={!nextCursor || isLoading}
        className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
