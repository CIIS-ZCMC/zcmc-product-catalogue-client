import { cn } from '@/lib/utils'

/** Centered message block used for empty, no-results and error states. */
export function ListState({ icon: Icon, title, description, children, className, role, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`
  return (
    <div
      role={role}
      className={cn('bg-card flex flex-col items-center gap-3 rounded-xl border px-6 py-14 text-center', className)}
    >
      {Icon && <Icon className="text-muted-foreground size-10" aria-hidden="true" />}
      <Heading className="text-base font-semibold">{title}</Heading>
      {description && <p className="text-muted-foreground max-w-md text-sm">{description}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
