import { useState } from 'react'
import { KeyRound, LogOut, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChangePasswordDialog } from '@/components/auth/change-password-dialog'
import { MobileNavigation } from './mobile-navigation'

function displayName(user) {
  if (!user) return ''
  if (user.first_name) return `${user.first_name} ${user.last_name || ''}`.trim()
  return user.name || user.email
}

export function AppHeader() {
  const { currentUser, isAdmin, logout, updateCurrentUser } = useAuth()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const name = displayName(currentUser)

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-4 backdrop-blur sm:px-6">
      <MobileNavigation />
      <span className="truncate text-sm font-semibold md:hidden">Product Catalogue Registry</span>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2" aria-label={`Account menu for ${name}`}>
              <span className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full">
                <UserRound className="size-4" aria-hidden="true" />
              </span>
              <span className="hidden max-w-[12rem] truncate text-sm font-medium sm:inline">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="truncate">{name}</span>
              <span className="text-muted-foreground truncate text-xs font-normal">{currentUser?.email}</span>
              <Badge variant={isAdmin ? 'accent' : 'secondary'} className="mt-1">
                {isAdmin ? 'Administrator' : 'Encoder'}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setChangePasswordOpen(true)}>
              <KeyRound aria-hidden="true" />
              Change password
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={logout}>
              <LogOut aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        user={currentUser}
        onSuccess={(updatedUser) => {
          updateCurrentUser?.(updatedUser)
          toast.success('Your password has been changed successfully.')
        }}
      />
    </header>
  )
}
