import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown, LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { commodityText } from '@/lib/product'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function commodityPath(c) {
  const r = c.relations
  if (r) return [r.segment, r.family, r.class].filter(Boolean).join(' › ')
  if (Array.isArray(c.hierarchy)) return c.hierarchy.slice(0, -1).map((h) => h.title).join(' › ')
  return ''
}

/**
 * Searchable UNSPSC commodity picker backed by GET /categories/commodities.
 * `value` is { key, code, title } or null. Extra props go to the trigger button
 * so it can be used inside <FormControl>.
 */
export function CommodityCombobox({ value, onChange, placeholder = 'Search UNSPSC commodity…', className, ...props }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search.trim(), 300)
  const [result, setResult] = useState({ status: 'idle', items: [] })

  useEffect(() => {
    if (!open) return undefined
    const controller = new AbortController()
    setResult((prev) => ({ ...prev, status: 'loading' }))
    api
      .getCommodities(debounced, { signal: controller.signal })
      .then((items) => setResult({ status: 'success', items: Array.isArray(items) ? items : [] }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setResult({ status: 'error', items: [] })
      })
    return () => controller.abort()
  }, [debounced, open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-auto min-h-9 w-full justify-between bg-card px-3 py-2 text-left font-normal whitespace-normal',
            !value && 'text-muted-foreground',
            className,
          )}
          {...props}
        >
          <span className="min-w-0 flex-1 break-words">{value ? commodityText(value) : placeholder}</span>
          <ChevronsUpDown className="opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[min(20rem,calc(100vw-2rem))] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type a commodity name or code"
            value={search}
            onValueChange={setSearch}
            aria-label="Search UNSPSC commodities"
          />
          <CommandList>
            {result.status === 'loading' && (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm" role="status">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Searching…
              </div>
            )}
            {result.status === 'error' && (
              <div className="text-destructive py-6 text-center text-sm" role="alert">
                Commodities could not be loaded. Try typing again.
              </div>
            )}
            {result.status === 'success' && (
              <>
                <CommandEmpty>No commodity matches “{debounced}”.</CommandEmpty>
                <CommandGroup heading={debounced ? 'Matches' : 'Common commodities'}>
                  {result.items.map((c) => {
                    const path = commodityPath(c)
                    const selected = value?.key === c.key
                    return (
                      <CommandItem
                        key={c.key}
                        value={String(c.key)}
                        onSelect={() => {
                          onChange(c)
                          setOpen(false)
                        }}
                        className="items-start"
                      >
                        <Check className={cn('mt-0.5', selected ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium break-words">{commodityText(c)}</span>
                          {path && <span className="text-muted-foreground block text-xs break-words">{path}</span>}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
