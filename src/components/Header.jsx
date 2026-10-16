import React from 'react';
import {
  Package,
  LayoutDashboard,
  History,
  FolderTree,
  Sparkles,
  Plus,
  Download,
  Upload,
  LogOut,
  ShieldCheck,
  User,
  Building2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { id: 'products', label: 'Product Catalogue', icon: Package },
  { id: 'categories', label: 'UNSPSC Explorer', icon: FolderTree },
  { id: 'naming', label: 'Uniform Naming', icon: Sparkles },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'logs', label: 'Activity Logs', icon: History },
];

export default function Header({
  currentTab,
  onTabChange,
  onOpenNewProduct,
  onOpenImport,
  onExport,
  stats,
  currentUser = null,
  onLogout = () => {},
}) {
  const displayName = currentUser?.first_name
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
    : currentUser?.name || currentUser?.email || 'User';

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand Identity & Navigation */}
          <div className="flex items-center gap-6 min-w-0">
            <div
              onClick={() => onTabChange('products')}
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-600/20 group-hover:from-blue-700 group-hover:to-blue-800 transition-all">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-900">
                    ZCMC SSOT
                  </span>
                  <Badge variant="blue" className="px-1.5 py-0 text-[10px] font-semibold">
                    REGISTRY
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-500 leading-none">
                  Product Catalogue Library
                </span>
              </div>
            </div>

            {/* Desktop Navigation Pills */}
            <nav className="hidden lg:flex items-center gap-1 rounded-lg bg-slate-100/80 p-1 border border-slate-200/60">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id || (item.id === 'products' && currentTab === 'product-form');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                      active
                        ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', active ? 'text-blue-600' : 'text-slate-500')} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Live Telemetry Pills, Quick Actions & User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {stats && (
              <div className="hidden 2xl:flex items-center gap-1.5 mr-2 pr-2 border-r border-slate-200">
                <Badge variant="outline" className="font-mono text-[11px] py-0.5 px-2 bg-slate-50">
                  Items: <strong className="ml-1 text-slate-900">{stats.total_products || 0}</strong>
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px] py-0.5 px-2 bg-slate-50">
                  UNSPSC: <strong className="ml-1 text-slate-900">{stats.total_categories?.toLocaleString() || '158,519'}</strong>
                </Badge>
                <Badge
                  variant={(stats.compliance_rate ?? 100) >= 80 ? 'success' : 'warning'}
                  className="text-[11px] py-0.5 px-2"
                >
                  Naming: {stats.compliance_rate ?? 100}%
                </Badge>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="hidden sm:inline-flex"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenImport}
              className="hidden sm:inline-flex"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span>Import CSV</span>
            </Button>

            <Button size="sm" onClick={onOpenNewProduct} className="shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Button>

            {/* User Profile Dropdown */}
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white pl-1.5 pr-2.5 py-1 text-left hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200/80">
                      {initials || <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className="hidden md:flex flex-col">
                      <span className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[130px]">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {currentUser.is_admin ? 'Administrator' : 'End User'}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-slate-900 leading-none">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {currentUser.email}
                      </p>
                      <div className="pt-1">
                        <Badge variant={currentUser.is_admin ? 'blue' : 'secondary'} className="text-[10px]">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {currentUser.is_admin ? 'System Administrator' : 'Institutional End User'}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="sm:hidden" />
                  <DropdownMenuItem onClick={onExport} className="sm:hidden">
                    <Download className="h-4 w-4 text-slate-500" />
                    <span>Export Catalogue CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenImport} className="sm:hidden">
                    <Upload className="h-4 w-4 text-slate-500" />
                    <span>Import Catalogue CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Navigation Bar */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                  active
                    ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200/70'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
