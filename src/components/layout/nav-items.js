import { History, LayoutDashboard, Package } from 'lucide-react'

// Only screens that already existed in the app's navigation (Header tabs).
export const NAV_ITEMS = [
  { to: '/products', label: 'Products', icon: Package },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/activity-logs', label: 'Activity logs', icon: History },
]
