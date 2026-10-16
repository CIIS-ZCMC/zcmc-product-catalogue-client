import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CircleAlert, FolderTree, GitCompareArrows, LoaderCircle, RefreshCw, Search, Sparkles, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { getCommodity } from '@/services/unspsc-service'
import { useUnspscSearch } from '@/hooks/use-unspsc-search'
import { commodityText, isAmbiguous, LEVEL_NAMES, parentPath, UNSPSC_SOURCE } from '@/lib/unspsc'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UnspscBrowse } from './unspsc-browse'

const MAX_COMPARE = 3
const PAGE = 8

const STRENGTH = {
  strong: { label: 'Strong match', className: 'border-success/40 text-success' },
  partial: { label: 'Partial match', className: 'border-warning/40 text-warning' },
  weak: { label: 'Related', className: 'text-muted-foreground' },
}

function StrengthBadge({ strength }) {
  if (!strength) return null
  const s = STRENGTH[strength]
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  )
}

// Indent each level on wider screens only; on phones the space is needed for the titles.
const INDENT = ['', 'sm:pl-2', 'sm:pl-4', 'sm:pl-6']

function Hierarchy({ commodity, className }) {
  const levels = commodity?.hierarchy || []
  if (!levels.length) return null
  return (
    <ol className={cn('space-y-1 text-sm', className)} aria-label="UNSPSC hierarchy">
      {levels.map((h, i) => (
        <li key={h.key ?? i} className={cn('grid grid-cols-[4.75rem_1fr] gap-2', INDENT[Math.min(i, 3)])}>
          <span className="text-muted-foreground text-xs leading-5">{LEVEL_NAMES[h.level] || 'Level'}</span>
          <span className={cn('min-w-0 break-words', i === levels.length - 1 && 'font-medium')}>
            <span className="text-muted-foreground mr-1.5 font-mono text-xs">{h.code}</span>
            {h.title}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Definition({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <p className="text-muted-foreground text-xs">The dataset has no definition for this commodity.</p>
  const long = text.length > 220
  return (
    <div className="text-sm">
      <p className={cn('text-muted-foreground', long && !expanded && 'line-clamp-3')}>{text}</p>
      {long && (
        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
          {expanded ? 'Show less' : 'Show full definition'}
        </Button>
      )}
    </div>
  )
}

/** Products already filed under the commodity: helps keep classification consistent and spot duplicates. */
function CommodityUsage({ categoryKey, excludeId }) {
  const [state, setState] = useState({ key: null, products: [], total: null, error: false })

  useEffect(() => {
    const controller = new AbortController()
    api
      .getProducts({ category_key: categoryKey, per_page: 5 }, { signal: controller.signal })
      .then((res) =>
        setState({ key: categoryKey, products: Array.isArray(res?.data) ? res.data : [], total: res?.total ?? null, error: false }),
      )
      .catch((err) => {
        if (err?.name !== 'AbortError') setState({ key: categoryKey, products: [], total: null, error: true })
      })
    return () => controller.abort()
  }, [categoryKey])

  if (state.key !== categoryKey || state.error) return null
  const others = state.products.filter((p) => String(p.id) !== String(excludeId))
  const total = state.total === null ? others.length : state.total - (state.products.length - others.length)
  if (others.length === 0) {
    return <p className="text-muted-foreground text-xs">No other catalogue product uses this commodity yet.</p>
  }
  return (
    <div className="space-y-1.5 text-xs" aria-live="polite">
      <p className="font-medium">
        {total === 1 ? '1 other product uses' : `${total.toLocaleString()} other products use`} this commodity. Check that you are not
        adding a duplicate:
      </p>
      <ul className="space-y-1">
        {others.slice(0, 4).map((p) => (
          <li key={p.id} className="break-words">
            <Link to={`/products/${p.id}`} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
              {p.item_description}
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>{' '}
            <span className="text-muted-foreground font-mono">{p.erp_item_code}</span>
          </li>
        ))}
      </ul>
      {total > 4 && (
        <Link to={`/products?category_key=${categoryKey}`} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
          See all {total.toLocaleString()} in the catalogue
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
      )}
    </div>
  )
}

function SourceNote() {
  return (
    <p className="text-muted-foreground text-xs">
      Source: {UNSPSC_SOURCE.name}, {UNSPSC_SOURCE.origin}. {UNSPSC_SOURCE.version ? `Version ${UNSPSC_SOURCE.version}.` : 'Version not recorded in the dataset.'}
    </p>
  )
}

function SelectedCommodity({ value, details, loading, onChange, onClear, excludeId, changeRef, id, 'aria-describedby': describedBy }) {
  const shown = details || value
  return (
    // The form label points at this container (id) so its name stays "UNSPSC commodity";
    // the buttons keep their own names.
    <div id={id} tabIndex={-1} className="bg-card space-y-3 rounded-lg border p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium">Selected commodity</p>
          <p className="mt-0.5 font-mono text-base font-semibold">{shown.code || '—'}</p>
          <p className="font-medium break-words">{shown.title}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onChange} ref={changeRef} aria-describedby={describedBy} aria-label="Change UNSPSC commodity">
            Change
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClear} aria-label={`Clear UNSPSC commodity ${shown.code}`}>
            <X aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>
      {loading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs" role="status">
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> Loading hierarchy…
        </p>
      ) : (
        <>
          <Hierarchy commodity={shown} />
          <Definition text={shown.definition} />
        </>
      )}
      <CommodityUsage categoryKey={shown.key} excludeId={excludeId} />
      <SourceNote />
    </div>
  )
}

function CompareDialog({ items, open, onOpenChange, onSelect, onRemove }) {
  const selecting = useRef(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Selecting closes the chooser, so focus is placed on the selection instead of the old trigger. */}
      <DialogContent
        className="sm:max-w-4xl"
        onCloseAutoFocus={(e) => {
          if (selecting.current) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Compare commodities</DialogTitle>
          <DialogDescription>Read the definitions and parent categories, then select the one that describes the item.</DialogDescription>
        </DialogHeader>
        <div className={cn('grid gap-4', items.length > 1 && 'md:grid-cols-2', items.length > 2 && 'lg:grid-cols-3')}>
          {items.map((c) => (
            <section key={c.key} className="flex flex-col gap-3 rounded-lg border p-4" aria-label={commodityText(c)}>
              <div>
                <p className="font-mono text-sm font-semibold">{c.code}</p>
                <h3 className="font-medium break-words">{c.title}</h3>
                {c.match && <StrengthBadge strength={c.match.strength} />}
              </div>
              <Hierarchy commodity={c} className="text-xs" />
              <p className="text-muted-foreground text-sm">{c.definition || 'No definition in the dataset.'}</p>
              {c.match?.reasons?.length > 0 && (
                <p className="text-muted-foreground text-xs">Why it matched: {c.match.reasons.join('; ')}.</p>
              )}
              <div className="mt-auto flex gap-2 pt-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    selecting.current = true
                    onSelect(c)
                  }}
                >
                  Select {c.code}
                </Button>
                <Button type="button" variant="ghost" onClick={() => onRemove(c)} aria-label={`Remove ${c.code} from comparison`}>
                  Remove
                </Button>
              </div>
            </section>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Back to results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResultList({ results, selectedKey, compareKeys, onToggleCompare, onSelect, stale }) {
  return (
    <ol className={cn('divide-y rounded-md border', stale && 'opacity-60')} aria-label="Matching commodities, best first">
      {results.map(({ item, strength, reasons }) => {
        const selected = String(item.key) === String(selectedKey)
        const compared = compareKeys.includes(item.key)
        const path = parentPath(item)
        const checkboxId = `compare-${item.key}`
        return (
          <li key={item.key} className={cn('flex flex-col gap-2 p-3 sm:flex-row sm:items-start', selected && 'bg-accent')}>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold">{item.code}</span>
                <StrengthBadge strength={strength} />
              </div>
              <p className="text-sm font-medium break-words">{item.title}</p>
              {path && <p className="text-muted-foreground text-xs break-words">{path}</p>}
              {item.definition && <p className="text-muted-foreground line-clamp-2 text-xs">{item.definition}</p>}
              {reasons.length > 0 && <p className="text-muted-foreground text-xs italic">Why: {reasons.join('; ')}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
              <Button
                type="button"
                size="sm"
                variant={selected ? 'secondary' : 'default'}
                onClick={() => onSelect(item, { strength, reasons })}
                aria-label={`Select ${item.code} ${item.title}`}
              >
                {selected ? 'Selected' : 'Select'}
              </Button>
              <label htmlFor={checkboxId} className="flex min-h-8 cursor-pointer items-center gap-2 text-xs">
                <input
                  id={checkboxId}
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={compared}
                  disabled={!compared && compareKeys.length >= MAX_COMPARE}
                  onChange={() => onToggleCompare(item, { strength, reasons })}
                />
                Compare
              </label>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function SearchPanel({ hint, selectedKey, onSelect, onBrowse, inputRef, inputProps }) {
  const [text, setText] = useState('')
  const [compare, setCompare] = useState([])
  const [compareOpen, setCompareOpen] = useState(false)
  const search = useUnspscSearch(text)
  const data = search.data
  const results = data?.results || []
  const ambiguous = !data?.suggestions && isAmbiguous(results)
  const hintQuery = (hint || '').trim()
  // How many results are shown; resets to one page whenever the query changes.
  const [more, setMore] = useState({ query: null, count: PAGE })
  const visibleCount = more.query === search.query ? more.count : PAGE

  const toggleCompare = (item, match) => {
    setCompare((list) =>
      list.some((c) => c.key === item.key) ? list.filter((c) => c.key !== item.key) : [...list, { ...item, match }].slice(0, MAX_COMPARE),
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
          <Input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Words, a description or an 8-digit code"
            autoComplete="off"
            spellCheck={false}
            className="h-10 pl-9"
            {...inputProps}
            ref={inputRef}
          />
        </div>
        {hintQuery && text.trim().toLowerCase() !== hintQuery.toLowerCase() && (
          <div>
            <Button type="button" variant="outline" size="sm" className="h-auto max-w-full py-1.5 text-left whitespace-normal" onClick={() => setText(hintQuery)}>
              <Sparkles aria-hidden="true" />
              <span className="break-words">Search with the item name: {hintQuery}</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex min-h-5 flex-wrap items-center justify-between gap-2 text-xs" aria-live="polite">
        <span className="text-muted-foreground">
          {search.pending && (
            <span className="inline-flex items-center gap-1.5">
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> Searching…
            </span>
          )}
          {!search.pending && data && !search.error && (
            data.suggestions
              ? 'Common hospital commodities. Type to search all commodities.'
              : `${results.length} ${results.length === 1 ? 'match' : 'matches'}, best first`
          )}
        </span>
        {compare.length > 0 && (
          <span className="flex items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setCompareOpen(true)}>
              <GitCompareArrows aria-hidden="true" />
              Compare {compare.length}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCompare([])}>
              Clear
            </Button>
          </span>
        )}
      </div>

      {search.error && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Commodities could not be searched</AlertTitle>
          <AlertDescription>
            <p>Check your connection to the catalogue server.</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={search.retry}>
              <RefreshCw aria-hidden="true" /> Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!search.error && data && !data.suggestions && results.length === 0 && !search.pending && (
        <div className="bg-muted/50 space-y-2 rounded-md border p-4 text-sm" role="status">
          <p className="font-medium">No commodity title matches “{search.query}”.</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
            <li>Use the generic noun on its own, e.g. “gloves” rather than a brand or size.</li>
            <li>Try a synonym the UNSPSC list uses, e.g. “syringe” for “injector”, “tissue” for “napkin”.</li>
            <li>Sizes, strengths and quantities are ignored because UNSPSC titles do not include them.</li>
          </ul>
          <Button type="button" variant="outline" size="sm" onClick={onBrowse}>
            <FolderTree aria-hidden="true" /> Browse the hierarchy instead
          </Button>
        </div>
      )}

      {ambiguous && (
        <Alert variant="warning" role="status">
          <GitCompareArrows aria-hidden="true" />
          <AlertTitle>Several commodities fit about equally</AlertTitle>
          <AlertDescription>Tick Compare on the closest ones and read their definitions before you choose.</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <ResultList
          results={results.slice(0, visibleCount)}
          selectedKey={selectedKey}
          compareKeys={compare.map((c) => c.key)}
          onToggleCompare={toggleCompare}
          onSelect={onSelect}
          stale={search.stale}
        />
      )}
      {results.length > visibleCount && (
        <Button type="button" variant="outline" size="sm" onClick={() => setMore({ query: search.query, count: visibleCount + PAGE })}>
          Show {Math.min(PAGE, results.length - visibleCount)} more of {results.length - visibleCount} remaining
        </Button>
      )}

      {data?.truncated && (
        <p className="text-muted-foreground text-xs">
          Many commodities contain these words and only the first batch was ranked. Add a more specific word to narrow the list.
        </p>
      )}

      <CompareDialog
        items={compare}
        open={compareOpen && compare.length > 0}
        onOpenChange={setCompareOpen}
        onSelect={(c) => {
          setCompareOpen(false)
          onSelect(c, c.match)
        }}
        onRemove={(c) => setCompare((list) => list.filter((x) => x.key !== c.key))}
      />
    </div>
  )
}

/**
 * UNSPSC classification assistant for the product form: ranked search with reasons,
 * side-by-side comparison, hierarchy browsing and an explicit select / change / clear.
 * `value` is { key, code, title } (plus hierarchy/definition when known) or null.
 * Matching rules are suggestions only; the user always makes the final choice.
 */
// `ref` is taken out so a ref passed by FormControl's Slot cannot override the internal input ref.
export function UnspscClassifier({ value, onChange, hint, excludeProductId, id, ref: _ref, ...ariaProps }) {
  const [choosing, setChoosing] = useState(!value)
  const [tab, setTab] = useState('search')
  const [details, setDetails] = useState({ key: null, data: null })
  const inputRef = useRef(null)
  const changeRef = useRef(null)
  const focusChange = useRef(false)
  const needsDetails = Boolean(value?.key) && !(value.hierarchy?.length > 1)

  useEffect(() => {
    if (!needsDetails) return undefined
    const controller = new AbortController()
    getCommodity(value.key, { signal: controller.signal })
      .then((data) => setDetails({ key: value.key, data }))
      .catch((err) => {
        if (err?.name !== 'AbortError') setDetails({ key: value.key, data: null })
      })
    return () => controller.abort()
  }, [needsDetails, value?.key])

  useEffect(() => {
    if (!focusChange.current || choosing) return undefined
    focusChange.current = false
    // After the chooser (and any compare dialog) has unmounted and released focus.
    const id = requestAnimationFrame(() => changeRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [choosing])

  const resolved = value && (needsDetails ? (details.key === value.key ? details.data : null) : value)
  const showChooser = choosing || !value

  const select = (item, match) => {
    onChange({ ...item, match })
    focusChange.current = true
    setChoosing(false)
  }

  if (!showChooser) {
    return (
      <SelectedCommodity
        value={value}
        details={resolved}
        loading={needsDetails && details.key !== value.key}
        excludeId={excludeProductId}
        changeRef={changeRef}
        id={id}
        {...ariaProps}
        onChange={() => {
          setTab('search')
          setChoosing(true)
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
        onClear={() => {
          onChange(null)
          setTab('search')
          setChoosing(true)
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
      />
    )
  }

  const browsePath = (resolved?.hierarchy || []).slice(0, -1)

  return (
    <div className="space-y-3 rounded-lg border p-3 sm:p-4">
      {value && (
        <div className="bg-muted/60 flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 text-sm">
          <span className="min-w-0 break-words">
            Current: <span className="font-medium">{commodityText(value)}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              focusChange.current = true
              setChoosing(false)
            }}
          >
            Keep current
          </Button>
        </div>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="search">
            <Search aria-hidden="true" /> Search
          </TabsTrigger>
          <TabsTrigger value="browse">
            <FolderTree aria-hidden="true" /> Browse hierarchy
          </TabsTrigger>
        </TabsList>
        <TabsContent value="search">
          <SearchPanel
            hint={hint}
            selectedKey={value?.key}
            onSelect={select}
            onBrowse={() => setTab('browse')}
            inputRef={inputRef}
            inputProps={{ id, 'aria-label': 'Search UNSPSC commodities', ...ariaProps }}
          />
        </TabsContent>
        <TabsContent value="browse">
          <UnspscBrowse initialPath={browsePath} selectedKey={value?.key} onSelect={(item) => select(item, null)} />
        </TabsContent>
      </Tabs>
      <SourceNote />
    </div>
  )
}
