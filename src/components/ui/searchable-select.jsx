import { useEffect, useId, useState } from 'react'
import { Check, ChevronsUpDown, LoaderCircle, RefreshCw, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { filterOptions } from '@/lib/search'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const MAX_CACHED_QUERIES = 30

function StatusRow({ children, role = 'status', className }) {
  return (
    <div role={role} className={cn('text-muted-foreground flex items-center justify-center gap-2 px-3 py-6 text-center text-sm', className)}>
      {children}
    </div>
  )
}

/**
 * Searchable single-select built on Popover + Command (shadcn combobox pattern).
 *
 * Local mode: pass `options`; filtering runs instantly over getSearchText (label, code, aliases).
 * Server mode: pass `loadOptions(query, { signal })` (keep it stable, e.g. module-level or useCallback).
 * Requests are debounced, the previous one is aborted, results are cached per query, and a slow
 * response can never replace a newer one.
 *
 * `value` is the selected option object (or null). The caller decides what to store
 * (getOptionValue gives the id/code); labels are only for display.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  loadOptions,
  debounceMs = 300,
  getOptionValue = (o) => String(o?.value ?? o?.id ?? o),
  getOptionLabel = (o) => String(o?.label ?? o?.name ?? o ?? ''),
  getOptionCode,
  getSearchText,
  renderOption,
  renderValue,
  placeholder = 'Select…',
  searchPlaceholder = 'Type to search',
  searchLabel = 'Search options',
  emptyMessage,
  groupHeading,
  loading: externalLoading = false,
  error: externalError = null,
  onRetry,
  clearable = true,
  clearLabel = 'Clear selection',
  maxResults = 100,
  disabled = false,
  className,
  contentClassName,
  ...triggerProps
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search.trim(), loadOptions ? debounceMs : 0)
  const [cache, setCache] = useState(() => new Map())
  const [failure, setFailure] = useState(null) // { query, error }
  const [retryToken, setRetryToken] = useState(0)
  const [active, setActive] = useState('')
  const statusId = useId()

  const serverMode = typeof loadOptions === 'function'

  useEffect(() => {
    if (!serverMode || !open || cache.has(debounced)) return undefined
    const controller = new AbortController()
    loadOptions(debounced, { signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return
        setCache((prev) => {
          const next = new Map(prev)
          next.set(debounced, Array.isArray(items) ? items : [])
          // Drop the oldest entries so a long session does not grow without bound.
          while (next.size > MAX_CACHED_QUERIES) next.delete(next.keys().next().value)
          return next
        })
        setFailure(null)
      })
      .catch((error) => {
        if (error?.name === 'AbortError' || controller.signal.aborted) return
        setFailure({ query: debounced, error })
      })
    return () => controller.abort()
  }, [serverMode, open, debounced, cache, loadOptions, retryToken])

  let items = []
  let status = 'success'
  if (serverMode) {
    const cached = cache.get(debounced)
    if (cached) items = cached
    else if (failure?.query === debounced) status = 'error'
    else status = 'loading'
  } else {
    if (externalLoading) status = 'loading'
    else if (externalError) status = 'error'
    else items = filterOptions(options || [], search, { getSearchText, getLabel: getOptionLabel, getCode: getOptionCode })
  }
  const pending = serverMode && search.trim() !== debounced
  const visible = items.slice(0, maxResults)
  const selectedValue = value ? getOptionValue(value) : null
  // Keep the keyboard highlight on a row that exists; async results replace the list under it.
  const visibleValues = visible.map(getOptionValue)
  const activeValue = visibleValues.includes(active) ? active : (visibleValues[0] ?? '')

  const retry = () => {
    if (serverMode) {
      setFailure(null)
      setRetryToken((n) => n + 1)
    } else {
      onRetry?.()
    }
  }

  const select = (option) => {
    onChange(option)
    setOpen(false)
    setSearch('')
  }

  const emptyText =
    typeof emptyMessage === 'function'
      ? emptyMessage(debounced)
      : emptyMessage || (debounced ? `No matches for “${debounced}”.` : 'No options available.')

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <div className={cn('relative w-full min-w-0', className)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && !open) {
                e.preventDefault()
                setOpen(true)
              }
            }}
            className={cn(
              'bg-card h-auto min-h-10 w-full justify-between px-3 py-2 text-left font-normal whitespace-normal sm:min-h-9',
              !value && 'text-muted-foreground',
              value && clearable && 'pr-16',
            )}
            {...triggerProps}
          >
            <span className="min-w-0 flex-1 break-words">
              {value ? (renderValue ? renderValue(value) : getOptionLabel(value)) : placeholder}
            </span>
            <ChevronsUpDown className={cn('opacity-50', value && clearable && 'absolute right-3')} aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        {value && clearable && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-8 size-7 -translate-y-1/2"
            onClick={() => onChange(null)}
            aria-label={`${clearLabel}: ${getOptionLabel(value)}`}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
      <PopoverContent
        align="start"
        className={cn(
          'w-(--radix-popover-trigger-width) max-w-[calc(100vw-1rem)] min-w-[min(20rem,calc(100vw-1rem))] p-0',
          contentClassName,
        )}
      >
        <Command shouldFilter={false} loop value={activeValue} onValueChange={setActive}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            aria-label={searchLabel}
            aria-describedby={statusId}
          />
          <CommandList className="max-h-[min(300px,45vh)]">
            {status === 'loading' && (
              <StatusRow>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                {debounced ? 'Searching…' : 'Loading…'}
              </StatusRow>
            )}
            {status === 'error' && (
              <StatusRow role="alert" className="text-destructive flex-col">
                <span>Options could not be loaded. Check your connection and try again.</span>
                {(serverMode || onRetry) && (
                  <Button type="button" variant="outline" size="sm" onClick={retry}>
                    <RefreshCw aria-hidden="true" />
                    Try again
                  </Button>
                )}
              </StatusRow>
            )}
            {status === 'success' && (
              <>
                {visible.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
                {visible.length > 0 && (
                  <CommandGroup
                    heading={groupHeading ? groupHeading(debounced) : undefined}
                    className={cn(pending && 'opacity-60')}
                  >
                    {visible.map((option) => {
                      const optionValue = getOptionValue(option)
                      const selected = optionValue === selectedValue
                      return (
                        <CommandItem
                          key={optionValue}
                          value={optionValue}
                          onSelect={() => select(option)}
                          aria-selected={selected}
                          className="min-h-10 items-start sm:min-h-0"
                        >
                          <Check className={cn('mt-0.5', selected ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                          <span className="min-w-0 flex-1 break-words">
                            {renderOption ? renderOption(option, { selected }) : getOptionLabel(option)}
                          </span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
                {items.length > visible.length && (
                  <p className="text-muted-foreground border-t px-3 py-2 text-xs">
                    Showing the first {visible.length} of {items.length}. Type more to narrow the list.
                  </p>
                )}
              </>
            )}
          </CommandList>
          <p id={statusId} className="sr-only" aria-live="polite">
            {status === 'success' && !pending ? `${items.length} ${items.length === 1 ? 'result' : 'results'}` : ''}
          </p>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
