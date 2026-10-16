import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export function BackLink({ to, state, children = 'Back to products' }) {
  return (
    <Link
      to={to}
      state={state}
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-sm text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {children}
    </Link>
  )
}
