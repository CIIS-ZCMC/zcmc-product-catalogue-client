import { BadgeDollarSign, History, LayoutDashboard, Network, Package, Sparkles, UsersRound } from 'lucide-react'

// Mirrors the app's existing navigation (Product Catalogue, UNSPSC Explorer, Uniform Naming,
// Dashboard, Activity Logs) plus the Pricing module. `adminOnly` items are hidden from encoders
// (the server still enforces access).
export const NAV_ITEMS = [
  { to: '/products', label: 'Product Catalogue', icon: Package },
  { to: '/pricing', label: 'Pricing', icon: BadgeDollarSign },
  { to: '/categories', label: 'UNSPSC Explorer', icon: Network },
  // { to: '/naming', label: 'Uniform Naming', icon: Sparkles },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/activity-logs', label: 'Activity logs', icon: History },
  { to: '/admin/users', label: 'Users & access', icon: UsersRound, adminOnly: true },
]
