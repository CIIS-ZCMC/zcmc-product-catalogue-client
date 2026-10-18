import { useId, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { filterOptions } from '@/lib/search'
import { useInternalCategories } from '@/hooks/use-lookups'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

const getSearchText = (c) => `${c.name} ${c.code}`

/**
 * Multi-select checklist of ZCMC internal categories (GET /internal-categories, about 30 rows, so
 * search is local). `value` is an array of category ids; `onChange` gets the new array.
 */
export function CategoryChecklist({ value, onChange, disabled = false, invalid = false, describedBy, ...props }) {
  const { data: categories, loading, error } = useInternalCategories()
  const [query, setQuery] = useState('')
  const searchId = useId()

  const visible = useMemo(
    () => (query.trim() ? filterOptions(categories, query, { getSearchText }) : categories),
    [categories, query],
  )
  const selected = new Set(value)

  const toggle = (id, checked) => {
    const next = new Set(value)
    if (checked) next.add(id)
    else next.delete(id)
    onChange(categories.map((c) => c.id).filter((cid) => next.has(cid)))
  }

  const selectVisible = () => onChange(Array.from(new Set([...value, ...visible.map((c) => c.id)])))
  const clearAll = () => onChange([])

  return (
    <div
      role="group"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn('bg-card rounded-md border', invalid && 'border-destructive', disabled && 'opacity-60')}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <div className="relative min-w-40 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden="true" />
          <label htmlFor={searchId} className="sr-only">
            Search internal categories
          </label>
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or code"
            className="h-8 pl-8"
            disabled={disabled}
          />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={selectVisible} disabled={disabled || visible.length === 0}>
          {query.trim() ? 'Select shown' : 'Select all'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={disabled || value.length === 0}>
          Clear
        </Button>
      </div>

      <div className="max-h-56 overflow-y-auto p-1">
        {loading && (
          <p role="status" className="text-muted-foreground px-3 py-6 text-center text-sm">
            Loading internal categories…
          </p>
        )}
        {error && !loading && (
          <div role="alert" className="text-muted-foreground flex flex-col items-center gap-2 px-3 py-6 text-center text-sm">
            Internal categories could not be loaded.
            <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw aria-hidden="true" />
              Reload page
            </Button>
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <p role="status" className="text-muted-foreground px-3 py-6 text-center text-sm">
            {query.trim() ? `No internal category matches “${query.trim()}”.` : 'No internal categories are set up on the server.'}
          </p>
        )}
        {!loading && !error && (
          <ul>
            {visible.map((c) => {
              const id = `${searchId}-${c.id}`
              return (
                <li key={c.id}>
                  <label htmlFor={id} className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5 text-sm">
                    <Checkbox id={id} checked={selected.has(c.id)} onCheckedChange={(v) => toggle(c.id, v === true)} disabled={disabled} />
                    <span className="min-w-0 flex-1 break-words">{c.name}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">{c.code}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="text-muted-foreground border-t px-3 py-1.5 text-xs" aria-live="polite">
        {value.length === 0 ? 'None selected' : `${value.length} selected`}
      </p>
    </div>
  )
}
