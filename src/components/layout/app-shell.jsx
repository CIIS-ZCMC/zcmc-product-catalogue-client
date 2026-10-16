import { useState } from 'react'
import { Outlet } from 'react-router'

import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'

const STORAGE_KEY = 'zcmc_catalogue_sidebar_collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Preference only; ignore storage failures.
      }
      return next
    })
  }

  return (
    <div className="flex min-h-dvh w-full">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <AppSidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="text-muted-foreground border-t px-4 py-3 text-center text-xs sm:px-6">
          Zamboanga City Medical Center (ZCMC) · Procurement Management Unit · Uniform Naming Standards
        </footer>
      </div>
    </div>
  )
}
