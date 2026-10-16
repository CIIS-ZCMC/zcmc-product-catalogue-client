import { Link } from 'react-router'
import { Copy, Ellipsis, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    toast.success('ERP item code copied.')
  } catch {
    toast.error('Could not copy to the clipboard.')
  }
}

export function ProductRowActions({ product, onDelete, linkState }) {
  const { isAdmin } = useAuth()
  const label = product.item_description || product.erp_item_code || `product ${product.id}`

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${label}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/products/${product.id}`} state={linkState}>
            <Eye aria-hidden="true" />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/products/${product.id}/edit`} state={linkState}>
            <Pencil aria-hidden="true" />
            Edit
          </Link>
        </DropdownMenuItem>
        {product.erp_item_code && (
          <DropdownMenuItem onSelect={() => copyCode(product.erp_item_code)}>
            <Copy aria-hidden="true" />
            Copy ERP code
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(product)}>
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
