import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { CircleAlert, RotateCw } from 'lucide-react'

import { api } from '@/services/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageFallback } from './route-fallbacks'
import { LegacyTheme } from '@/components/legacy-theme'
import DashboardView from '@/components/DashboardView'

// Existing MUI dashboard, mounted inside the new shell; loading and error states are shadcn.
export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    api
      .getDashboardStats()
      .then((data) => {
        if (!active) return
        setStats(data)
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        console.error('Failed to load dashboard stats', err)
        setError(err)
      })
    return () => {
      active = false
    }
  }, [attempt])

  const retry = () => {
    setError(null)
    setStats(null)
    setAttempt((n) => n + 1)
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-xl">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>The dashboard could not be loaded</AlertTitle>
        <AlertDescription>
          <p>
            {error instanceof TypeError
              ? 'The catalogue server could not be reached. Check the connection and try again.'
              : error.message || 'The server returned an error. Try again.'}
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={retry}>
            <RotateCw aria-hidden="true" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!stats) return <PageFallback />

  return (
    <LegacyTheme>
      <DashboardView
        stats={stats}
        onNavigateToProducts={() => navigate('/products')}
      />
    </LegacyTheme>
  )
}
