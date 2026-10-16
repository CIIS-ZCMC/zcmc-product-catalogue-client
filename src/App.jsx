import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeProvider } from '@mui/material'
import { RouterProvider } from 'react-router'
import { toast } from 'sonner'

import { theme } from './theme'
import { router } from './router'
import { api, authStorage } from './services/api'
import { AuthProvider } from './context/auth-context'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import AuthView from './components/AuthView'

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser())

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      authStorage.clear()
      setCurrentUser(null)
      toast.success('Signed out.')
    }
  }, [])

  const handleAuthSuccess = (user) => {
    setCurrentUser(user)
    toast.success(`Welcome back, ${user.email}.`)
  }

  useEffect(() => {
    const handleUnauthorized = () => {
      authStorage.clear()
      setCurrentUser(null)
      toast.warning('Your session expired. Please sign in again.')
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const authValue = useMemo(
    () => ({ currentUser, isAdmin: currentUser?.is_admin === true, logout }),
    [currentUser, logout],
  )

  return (
    // MUI ThemeProvider stays for the screens not yet moved to shadcn/ui (sign-in, dashboard, activity logs, CSV import).
    <ThemeProvider theme={theme}>
      <TooltipProvider>
        {currentUser ? (
          <AuthProvider value={authValue}>
            <RouterProvider router={router} />
          </AuthProvider>
        ) : (
          <AuthView onAuthSuccess={handleAuthSuccess} />
        )}
        <Toaster position="bottom-right" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  )
}
