import { NavLink } from 'react-router'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NAV_ITEMS } from './nav-items'

export function NavList({ collapsed = false, onNavigate }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const link = (
          <NavLink
            to={to}
            onClick={onNavigate}
            aria-label={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
                collapsed && 'justify-center px-0',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        )

        return (
          <li key={to}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function AppSidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        'bg-sidebar border-sidebar-border sticky top-0 hidden h-dvh shrink-0 flex-col border-r md:flex',
        // Tablet always uses the icon rail; desktop honours the user's choice.
        'md:w-16',
        collapsed ? 'lg:w-16' : 'lg:w-60',
      )}
    >
      <div className={cn('flex h-14 items-center gap-2 border-b px-3', collapsed && 'lg:justify-center')}>
        <span
          className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold"
          aria-hidden="true"
        >
          ZC
        </span>
        <span className={cn('hidden min-w-0 flex-col leading-tight', !collapsed && 'lg:flex')}>
          <span className="truncate text-sm font-semibold">Product Catalogue</span>
          <span className="text-muted-foreground truncate text-xs">ZCMC Procurement</span>
        </span>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto p-2">
        {/* Icon rail on tablet; full list on desktop unless collapsed. */}
        <div className="lg:hidden">
          <NavList collapsed />
        </div>
        <div className="hidden lg:block">
          <NavList collapsed={collapsed} />
        </div>
      </nav>

      <div className="hidden border-t p-2 lg:block">
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full', collapsed ? 'justify-center' : 'justify-start')}
          onClick={onToggle}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}
