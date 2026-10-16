import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { api } from '@/services/api'
import DashboardView from '@/components/DashboardView'

// Existing MUI dashboard, mounted inside the new shell unchanged.
export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    api
      .getDashboardStats()
      .then((data) => active && setStats(data))
      .catch((err) => console.error('Failed to load dashboard stats', err))
    return () => {
      active = false
    }
  }, [])

  return <DashboardView stats={stats} onNavigateToProducts={() => navigate('/products')} />
}
