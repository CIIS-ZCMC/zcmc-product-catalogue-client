import { Skeleton } from '@/components/ui/skeleton'

export function ProductListSkeleton({ rows = 8 }) {
  const items = Array.from({ length: rows }, (_, i) => i)
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Loading products…
      </span>
      <div
        className="bg-card hidden rounded-xl border md:block"
        aria-hidden="true"
      >
        <div className="bg-muted/60 h-10 rounded-t-xl border-b" />
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b p-3 last:border-0"
          >
            <Skeleton className="h-4 w-36" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="hidden h-4 w-48 lg:block" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="size-8" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:hidden" aria-hidden="true">
        {items.slice(0, 5).map((i) => (
          <div key={i} className="bg-card space-y-2 rounded-xl border p-4">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
