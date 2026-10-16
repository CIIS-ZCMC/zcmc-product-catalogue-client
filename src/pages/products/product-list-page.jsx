import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { CircleAlert, Download, LoaderCircle, PackageOpen, Plus, RefreshCw, Search, SearchX, SlidersHorizontal, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/services/api'
import { useProducts } from '@/hooks/use-products'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useInternalCategories } from '@/hooks/use-lookups'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { commodityText } from '@/lib/product'
import { DeleteProductDialog } from '@/components/products/delete-product-dialog'
import { ListPagination } from '@/components/products/list-pagination'
import { PAGE_SIZES } from '@/lib/product-list-options'
import { ListState } from '@/components/products/list-state'
import { ProductCardList } from '@/components/products/product-card-list'
import { ProductFilters } from '@/components/products/product-filters'
import { ProductListSkeleton } from '@/components/products/product-list-skeleton'
import { ProductTable } from '@/components/products/product-table'
import ImportExportModal from '@/components/ImportExportModal'

const FILTER_KEYS = ['internal_category_id', 'category_key', 'uom']
const DEFAULT_SORT = { by: 'created_at', order: 'desc' }

function readQuery(params) {
  const perPage = Number(params.get('per_page'))
  return {
    search: params.get('q') || '',
    internal_category_id: params.get('internal_category_id') || '',
    category_key: params.get('category_key') || '',
    uom: params.get('uom') || '',
    sort_by: params.get('sort_by') || DEFAULT_SORT.by,
    sort_order: params.get('sort_order') === 'asc' ? 'asc' : DEFAULT_SORT.order,
    page: Math.max(1, Number(params.get('page')) || 1),
    per_page: PAGE_SIZES.includes(perPage) ? perPage : PAGE_SIZES[0],
  }
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const query = useMemo(() => readQuery(searchParams), [searchParams])
  const { status, products, meta, error, reload } = useProducts(query)

  // Search box is local so typing stays instant; the URL (and request) follow after a pause.
  const [searchInput, setSearchInput] = useState(query.search)
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 350)

  const [commodity, setCommodity] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { data: internalCategories } = useInternalCategories()

  const updateParams = (changes, { resetPage = true, replace = false } = {}) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([k, v]) => {
          if (v === '' || v === null || v === undefined) next.delete(k)
          else next.set(k, String(v))
        })
        if (resetPage) next.delete('page')
        return next
      },
      { replace },
    )
  }

  useEffect(() => {
    if (debouncedSearch !== query.search) updateParams({ q: debouncedSearch }, { replace: true })
    // Only react to the debounced text, not to URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Keep the box in step when the URL changes from outside (back/forward, chip removal).
  useEffect(() => {
    setSearchInput((current) => (current.trim() === query.search ? current : query.search))
  }, [query.search])

  // Resolve a label for a category_key that arrived via the URL (shared link, back button).
  useEffect(() => {
    if (!query.category_key) {
      setCommodity(null)
      return undefined
    }
    if (commodity && String(commodity.key) === query.category_key) return undefined
    let active = true
    api
      .getCategory(query.category_key)
      .then((res) => {
        const cat = res?.category || res
        if (active && cat) setCommodity({ key: cat.key, code: cat.code, title: cat.title })
      })
      .catch(() => active && setCommodity({ key: query.category_key, code: '', title: `Category ${query.category_key}` }))
    return () => {
      active = false
    }
  }, [query.category_key, commodity])

  const handleFilterChange = (changes, selectedCommodity) => {
    if ('category_key' in changes) setCommodity(selectedCommodity || null)
    updateParams(changes)
  }

  const activeFilterCount = FILTER_KEYS.filter((k) => query[k]).length
  const hasQuery = Boolean(query.search) || activeFilterCount > 0

  const clearAll = () => {
    setSearchInput('')
    setCommodity(null)
    updateParams({ q: '', internal_category_id: '', category_key: '', uom: '' })
  }

  const sort = { by: query.sort_by, order: query.sort_order }
  const handleSort = (field) => {
    const order = sort.by === field && sort.order === 'asc' ? 'desc' : 'asc'
    updateParams({ sort_by: field, sort_order: order })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { page: _page, per_page: _perPage, ...exportFilters } = query
      await api.downloadExportCsv(exportFilters)
    } catch (err) {
      toast.error(err.message || 'Export failed. Try again.')
    } finally {
      setExporting(false)
    }
  }

  // Lets detail/edit pages return to this exact list view (filters, sort, page).
  const linkState = { from: `${location.pathname}${location.search}` }

  const internalCategory = internalCategories.find((c) => String(c.id) === query.internal_category_id)
  const chips = [
    query.search && {
      key: 'q',
      label: `Search: “${query.search}”`,
      clear: () => {
        setSearchInput('')
        updateParams({ q: '' })
      },
    },
    query.internal_category_id && {
      key: 'internal',
      label: `Internal: ${internalCategory ? internalCategory.code : query.internal_category_id}`,
      clear: () => updateParams({ internal_category_id: '' }),
    },
    query.category_key && {
      key: 'category',
      label: `UNSPSC: ${commodity ? commodityText(commodity) : '…'}`,
      clear: () => handleFilterChange({ category_key: '' }, null),
    },
    query.uom && { key: 'uom', label: `UOM: ${query.uom}`, clear: () => updateParams({ uom: '' }) },
  ].filter(Boolean)

  const totalLabel = meta?.total !== null && meta?.total !== undefined ? `${meta.total.toLocaleString()} products` : null

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Products"
        description="Search and manage standardized items in the ZCMC procurement catalogue."
        actions={
          <>
            <Button variant="outline" className="order-2 sm:order-none" onClick={() => setImportOpen(true)}>
              <Upload aria-hidden="true" />
              Import CSV
            </Button>
            <Button variant="outline" className="order-3 sm:order-none" onClick={handleExport} disabled={exporting}>
              {exporting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button asChild className="order-1 w-full sm:order-none sm:w-auto">
              <Link to="/products/new" state={linkState}>
                <Plus aria-hidden="true" />
                Add product
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Search and filters" className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
            <Input
              id="product-search"
              type="search"
              inputMode="search"
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

          {/* Mobile: filters live in a bottom sheet so the list keeps the screen. */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 md:hidden">
                <SlidersHorizontal aria-hidden="true" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-0.5 h-5 min-w-5 px-1" aria-label={`${activeFilterCount} active`}>
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl">
              <SheetHeader>
                <SheetTitle>Filter products</SheetTitle>
                <SheetDescription>Changes apply right away.</SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto px-4">
                <ProductFilters
                  layout="stack"
                  filters={query}
                  commodity={commodity}
                  onChange={handleFilterChange}
                  sort={sort}
                  onSortChange={({ by, order }) => updateParams({ sort_by: by, sort_order: order })}
                  showSort
                />
              </div>
              <SheetFooter className="flex-row">
                <Button variant="outline" className="flex-1" onClick={clearAll} disabled={!hasQuery}>
                  Clear all
                </Button>
                <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                  Show results
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:block">
          <ProductFilters filters={query} commodity={commodity} onChange={handleFilterChange} sort={sort} />
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((chip) => (
              <Badge key={chip.key} variant="outline" className="h-7 max-w-full gap-1 pr-1 pl-2.5 text-xs">
                <span className="truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.clear}
                  className="hover:bg-muted rounded p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </Badge>
            ))}
            <Button variant="link" size="sm" className="h-7 px-1" onClick={clearAll}>
              Clear all
            </Button>
          </div>
        )}
      </section>

      <div className="mb-3 flex min-h-5 items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground" aria-live="polite">
          {status === 'refreshing' ? 'Updating results…' : status === 'success' ? totalLabel : ''}
        </p>
      </div>

      {status === 'loading' && <ProductListSkeleton rows={Math.min(query.per_page, 10)} />}

      {status === 'error' && (
        <ListState
          role="alert"
          icon={CircleAlert}
          title="Products could not be loaded"
          description={error?.message || 'Check your connection to the catalogue server and try again.'}
        >
          <Button onClick={reload}>
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        </ListState>
      )}

      {(status === 'success' || status === 'refreshing') && products.length === 0 && (
        hasQuery ? (
          <ListState
            icon={SearchX}
            title="No products match"
            description="Nothing in the catalogue matches this search and filter combination."
          >
            <Button variant="outline" onClick={clearAll}>
              Clear search and filters
            </Button>
          </ListState>
        ) : (
          <ListState
            icon={PackageOpen}
            title="No products in the catalogue yet"
            description="Products registered with their UNSPSC commodity, internal category and system codes appear here."
          >
            <Button asChild>
              <Link to="/products/new" state={linkState}>
                <Plus aria-hidden="true" />
                Add product
              </Link>
            </Button>
          </ListState>
        )
      )}

      {(status === 'success' || status === 'refreshing') && products.length > 0 && (
        <div className="space-y-4" aria-busy={status === 'refreshing'}>
          <div className="hidden md:block">
            <ProductTable
              products={products}
              sort={sort}
              onSort={handleSort}
              onDelete={setDeleteTarget}
              linkState={linkState}
              busy={status === 'refreshing'}
            />
          </div>
          <div className="md:hidden">
            <ProductCardList products={products} onDelete={setDeleteTarget} linkState={linkState} busy={status === 'refreshing'} />
          </div>
          <ListPagination
            meta={meta}
            onPageChange={(page) => {
              updateParams({ page: page > 1 ? page : '' }, { resetPage: false })
              document.getElementById('main-content')?.focus()
              window.scrollTo({ top: 0 })
            }}
            onPerPageChange={(n) => updateParams({ per_page: n === PAGE_SIZES[0] ? '' : n })}
          />
        </div>
      )}

      <DeleteProductDialog
        product={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={(p) => {
          toast.success(`Deleted ${p.erp_item_code || 'product'}.`)
          // Step back a page if the last row on this page was removed.
          if (products.length === 1 && query.page > 1) updateParams({ page: query.page - 1 }, { resetPage: false })
          else reload()
        }}
      />

      <ImportExportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportSuccess={() => {
          reload()
          toast.success('Import completed.')
        }}
      />
    </div>
  )
}
