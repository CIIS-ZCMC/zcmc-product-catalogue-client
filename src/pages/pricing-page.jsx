import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  CircleAlert,
  PackageOpen,
  Pencil,
  RefreshCw,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { useProducts } from '@/hooks/use-products'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { display, formatPeso } from '@/lib/product'
import { PAGE_SIZES } from '@/lib/product-list-options'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ListPagination } from '@/components/products/list-pagination'
import { ListState } from '@/components/products/list-state'
import { ProductListSkeleton } from '@/components/products/product-list-skeleton'
import { PriceEditDialog } from '@/components/products/price-edit-dialog'

// Sort fields the server accepts (ProductService::listProducts).
const SORTS = [
  { value: 'item_description:asc', label: 'Description A–Z' },
  { value: 'unit_price:desc', label: 'Price, high to low' },
  { value: 'unit_price:asc', label: 'Price, low to high' },
  { value: 'erp_item_code:asc', label: 'ERP code A–Z' },
]
const DEFAULT_SORT = 'item_description:asc'

export default function PricingPage() {
  const [params, setParams] = useSearchParams()
  const sortValue = SORTS.some(
    (s) => s.value === `${params.get('sort_by')}:${params.get('sort_order')}`
  )
    ? `${params.get('sort_by')}:${params.get('sort_order')}`
    : DEFAULT_SORT
  const perPage = PAGE_SIZES.includes(Number(params.get('per_page')))
    ? Number(params.get('per_page'))
    : PAGE_SIZES[0]
  const query = useMemo(() => {
    const [sort_by, sort_order] = sortValue.split(':')
    return {
      search: params.get('q') || '',
      sort_by,
      sort_order,
      page: Math.max(1, Number(params.get('page')) || 1),
      per_page: perPage,
    }
  }, [params, sortValue, perPage])
  const { status, products, meta, error, reload } = useProducts(query)

  const [searchInput, setSearchInput] = useState(query.search)
  const debounced = useDebouncedValue(searchInput.trim(), 350)
  const [editing, setEditing] = useState(null)

  const update = (changes, { resetPage = true } = {}) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(changes).forEach(([k, v]) =>
        v === '' || v == null ? next.delete(k) : next.set(k, String(v))
      )
      if (resetPage) next.delete('page')
      return next
    })

  useEffect(() => {
    if (debounced !== query.search) update({ q: debounced })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const hasQuery = Boolean(query.search)
  const busy = status === 'refreshing'
  const rows = status === 'success' || status === 'refreshing' ? products : []

  const onSaved = (product, price) => {
    toast.success(
      `Price of ${product.erp_item_code || 'product'} is now ${formatPeso(price)}.`
    )
    reload()
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Pricing"
        description="Review unit prices and record price changes. Every change is kept in the product's price history."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <div className="relative">
          <label htmlFor="price-search" className="sr-only">
            Search products
          </label>
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="price-search"
            type="search"
            autoComplete="off"
            placeholder="Search description or any code"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 pr-9 pl-9"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="price-sort" className="shrink-0">
            Sort
          </Label>
          <Select
            value={sortValue}
            onValueChange={(v) => {
              const [by, order] = v.split(':')
              update({ sort_by: by, sort_order: order })
            }}
          >
            <SelectTrigger id="price-sort" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p
        className="text-muted-foreground mb-3 min-h-5 text-sm"
        aria-live="polite"
      >
        {busy
          ? 'Updating results…'
          : status === 'success' && meta?.total != null
            ? `${meta.total.toLocaleString()} products`
            : ''}
      </p>

      {status === 'loading' && (
        <ProductListSkeleton rows={Math.min(perPage, 10)} />
      )}

      {status === 'error' && (
        <ListState
          role="alert"
          icon={CircleAlert}
          title="Prices could not be loaded"
          description={error?.message}
        >
          <Button onClick={reload}>
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        </ListState>
      )}

      {(status === 'success' || busy) &&
        rows.length === 0 &&
        (hasQuery ? (
          <ListState
            icon={SearchX}
            title="No products match"
            description="Nothing in the catalogue matches this search."
          >
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput('')
                update({ q: '' })
              }}
            >
              Clear search
            </Button>
          </ListState>
        ) : (
          <ListState
            icon={PackageOpen}
            title="No products to price yet"
            description="Add products to the catalogue first, then record their prices here."
          >
            <Button asChild>
              <Link to="/products/new">Add product</Link>
            </Button>
          </ListState>
        ))}

      {rows.length > 0 && (
        <div className="space-y-4" aria-busy={busy}>
          <div
            className={cn(
              'bg-card hidden rounded-xl border md:block',
              busy && 'opacity-60 transition-opacity'
            )}
          >
            <Table className="table-fixed">
              <caption className="sr-only">Unit prices</caption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-48">ERP code</TableHead>
                  <TableHead>Item description</TableHead>
                  <TableHead className="w-24">UOM</TableHead>
                  <TableHead className="w-36 text-right">Unit price</TableHead>
                  <TableHead className="w-44">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs break-all">
                      {display(p.erp_item_code)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/products/${p.id}`}
                        className="font-medium break-words underline-offset-4 hover:underline"
                      >
                        {display(p.item_description)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{display(p.uom)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPeso(p.unit_price)}
                    </TableCell>
                    <TableCell className="py-2 pr-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(p)}
                        aria-label={`Update price of ${display(p.item_description)}`}
                      >
                        <Pencil aria-hidden="true" />
                        Update price
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul
            className={cn('grid gap-3 md:hidden', busy && 'opacity-60')}
            aria-label="Unit prices"
          >
            {rows.map((p) => (
              <li
                key={p.id}
                className="bg-card space-y-3 rounded-xl border p-4"
              >
                <div className="space-y-1">
                  <Link
                    to={`/products/${p.id}`}
                    className="block font-medium break-words"
                  >
                    {display(p.item_description)}
                  </Link>
                  <p className="text-muted-foreground font-mono text-xs break-all">
                    {display(p.erp_item_code)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold tabular-nums">
                    {formatPeso(p.unit_price)}{' '}
                    <span className="text-muted-foreground text-xs font-normal">
                      per {display(p.uom)}
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(p)}
                    aria-label={`Update price of ${display(p.item_description)}`}
                  >
                    <Pencil aria-hidden="true" />
                    Update
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <ListPagination
            meta={meta}
            onPageChange={(page) => {
              update({ page: page > 1 ? page : '' }, { resetPage: false })
              window.scrollTo({ top: 0 })
            }}
            onPerPageChange={(n) =>
              update({ per_page: n === PAGE_SIZES[0] ? '' : n })
            }
          />
        </div>
      )}

      <PriceEditDialog
        product={editing}
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={onSaved}
      />
    </div>
  )
}
