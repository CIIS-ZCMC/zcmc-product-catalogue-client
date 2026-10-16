import { useEffect, useState } from 'react'
import { ChevronRight, CircleAlert, LoaderCircle, RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { filterOptions } from '@/lib/search'
import { LEVEL_NAMES, toCommodity } from '@/lib/unspsc'
import { getChildren, getSegments, isCommodity } from '@/services/unspsc-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ROOT = 'root'
const FILTER_THRESHOLD = 12

function crumb(node) {
  return { key: node.key, code: node.code, title: node.title, level: node.level }
}

/**
 * Drill-down through Segment → Family → Class → Commodity using
 * GET /categories/roots and /categories/:key/children (one level at a time).
 * `initialPath` (segment → class) lets it open where the current selection lives.
 */
export function UnspscBrowse({ initialPath = [], selectedKey, onSelect }) {
  const [path, setPath] = useState(initialPath)
  const [result, setResult] = useState({ key: null, items: null, error: null })
  const [retryToken, setRetryToken] = useState(0)
  const [filter, setFilter] = useState('')
  const current = path[path.length - 1]
  const currentKey = current ? current.key : ROOT

  useEffect(() => {
    let active = true
    const load = currentKey === ROOT ? getSegments() : getChildren(currentKey)
    load
      .then((items) => active && setResult({ key: currentKey, items: Array.isArray(items) ? items : [], error: null }))
      .catch((error) => active && setResult({ key: currentKey, items: null, error }))
    return () => {
      active = false
    }
  }, [currentKey, retryToken])

  const ready = result.key === currentKey
  const items = ready && result.items ? result.items : []
  const shown = filter ? filterOptions(items, filter, { getSearchText: (n) => `${n.title} ${n.code}`, getLabel: (n) => n.title, getCode: (n) => n.code }) : items
  const nextLevel = LEVEL_NAMES[(current?.level ?? -1) + 1] || 'Item'

  const goTo = (index) => {
    setFilter('')
    setPath((p) => p.slice(0, index))
  }

  return (
    <div className="space-y-3">
      <nav aria-label="UNSPSC hierarchy position">
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          <li>
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => goTo(0)} disabled={path.length === 0}>
              All segments
            </Button>
          </li>
          {path.map((node, i) => (
            <li key={node.key} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
              {i === path.length - 1 ? (
                <span className="font-medium break-words" aria-current="location">
                  {node.title} <span className="text-muted-foreground font-mono text-xs">{node.code}</span>
                </span>
              ) : (
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-left whitespace-normal" onClick={() => goTo(i + 1)}>
                  {node.title}
                </Button>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {ready && items.length > FILTER_THRESHOLD && (
        <div className="grid gap-1.5">
          <label htmlFor="unspsc-browse-filter" className="sr-only">
            Filter this list
          </label>
          <Input
            id="unspsc-browse-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Filter ${items.length} ${nextLevel.toLowerCase()} entries`}
            autoComplete="off"
          />
        </div>
      )}

      {!ready && (
        <p className="text-muted-foreground flex items-center gap-2 py-6 text-sm" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Loading {nextLevel.toLowerCase()} list…
        </p>
      )}

      {ready && result.error && (
        <div className="text-destructive flex flex-wrap items-center gap-3 py-4 text-sm" role="alert">
          <CircleAlert className="size-4" aria-hidden="true" />
          This level could not be loaded.
          <Button type="button" variant="outline" size="sm" onClick={() => setRetryToken((n) => n + 1)}>
            <RefreshCw aria-hidden="true" /> Try again
          </Button>
        </div>
      )}

      {ready && !result.error && shown.length === 0 && (
        <p className="text-muted-foreground py-4 text-sm">{filter ? `Nothing here matches “${filter}”.` : 'This level has no entries.'}</p>
      )}

      {ready && shown.length > 0 && (
        <ul className="max-h-96 divide-y overflow-y-auto rounded-md border" aria-label={`${nextLevel} list`}>
          {shown.map((node) => {
            const commodity = isCommodity(node)
            const selected = String(node.key) === String(selectedKey)
            return (
              <li key={node.key} className={cn('flex items-start gap-3 px-3 py-2.5', selected && 'bg-accent')}>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium break-words">{node.title}</span>
                  <span className="text-muted-foreground block font-mono text-xs">
                    {node.code}
                    {!commodity && typeof node.children_count === 'number' && (
                      <span className="font-sans"> · {node.children_count.toLocaleString()} below</span>
                    )}
                  </span>
                  {commodity && node.definition && (
                    <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs">{node.definition}</span>
                  )}
                </span>
                {commodity ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={selected ? 'secondary' : 'outline'}
                    onClick={() => onSelect(toCommodity(node, path.map(crumb)))}
                    aria-label={`Select ${node.code} ${node.title}`}
                  >
                    {selected ? 'Selected' : 'Select'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFilter('')
                      setPath((p) => [...p, crumb(node)])
                    }}
                    aria-label={`Open ${LEVEL_NAMES[node.level] || 'level'} ${node.code} ${node.title}`}
                  >
                    Open
                    <ChevronRight aria-hidden="true" />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
