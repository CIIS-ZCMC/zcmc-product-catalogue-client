import { Link, useRouteError } from 'react-router'
import { CircleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page…</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function RouteErrorPage({ notFound = false }) {
  const error = useRouteError()
  if (error) console.error(error)

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <CircleAlert
        className="text-muted-foreground size-10"
        aria-hidden="true"
      />
      <h1 className="text-xl font-semibold">
        {notFound ? 'Page not found' : 'Something went wrong'}
      </h1>
      <p className="text-muted-foreground text-sm">
        {notFound
          ? 'The page you opened does not exist in the product catalogue.'
          : 'This page could not be displayed. Try again, or go back to the product list.'}
      </p>
      <Button asChild>
        <Link to="/products">Go to products</Link>
      </Button>
    </div>
  )
}
