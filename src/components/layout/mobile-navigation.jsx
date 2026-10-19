import { useState } from 'react'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NavList } from './app-sidebar'
import zcmcLogo from '@/assets/zcmc-logo.png'

export function MobileNavigation() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex-row items-center gap-3 border-b">
          <img
            src={zcmcLogo}
            alt=""
            className="h-10 w-auto shrink-0 object-contain"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <SheetTitle>Product Catalogue</SheetTitle>
            <SheetDescription>
              ZCMC Procurement Management Unit
            </SheetDescription>
          </div>
        </SheetHeader>
        <nav aria-label="Main" className="p-2">
          <NavList onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  )
}
