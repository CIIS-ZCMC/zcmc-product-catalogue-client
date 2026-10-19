import { cn } from '@/lib/utils'

/** Consistent page title row: heading + description on the left, actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {children}
        <h1 className="text-2xl font-semibold tracking-tight break-words">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  )
}
