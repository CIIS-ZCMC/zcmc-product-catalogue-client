import { Link } from 'react-router'

import { cn } from '@/lib/utils'
import { commodityLabel, display } from '@/lib/product'
import { Badge } from '@/components/ui/badge'
import { ProductRowActions } from './product-row-actions'

/** Mobile listing (below md): one compact card per product, no sideways scrolling. */
export function ProductCardList({ products, onDelete, linkState, busy }) {
  return (
    <ul
      className={cn('grid gap-3', busy && 'opacity-60 transition-opacity')}
      aria-label="Catalogue products"
    >
      {products.map((p) => (
        <li key={p.id} className="bg-card relative rounded-xl border p-4">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <Link
                to={`/products/${p.id}`}
                state={linkState}
                className="block font-medium break-words outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
              >
                {display(p.item_description)}
              </Link>
              <p className="text-muted-foreground font-mono text-xs break-all">
                <span className="sr-only">ERP code </span>
                {display(p.erp_item_code)}
              </p>
              <p className="text-muted-foreground text-xs [overflow-wrap:anywhere]">
                BizBox {display(p.bizbox_item_code)}
                {p.philgeps_code && <> · PhilGEPS {p.philgeps_code}</>}
              </p>
            </div>
            {/* Sits above the card-wide link so the menu stays tappable. */}
            <div className="relative z-10 -mt-1 -mr-2">
              <ProductRowActions
                product={p}
                onDelete={onDelete}
                linkState={linkState}
              />
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-xs break-words">
            {commodityLabel(p)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary">UOM: {display(p.uom)}</Badge>
            {p.internal_category_code && (
              <Badge variant="outline" className="font-mono">
                {p.internal_category_code}
              </Badge>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
