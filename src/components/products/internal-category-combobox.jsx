import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useInternalCategories } from '@/hooks/use-lookups'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Searchable picker for ZCMC internal categories. `value` is the category id (number|string) or null. */
export function InternalCategoryCombobox({ value, onChange, placeholder = 'Select internal category', className, ...props }) {
  const [open, setOpen] = useState(false)
  const { data: categories, loading, error } = useInternalCategories()
  const selected = categories.find((c) => String(c.id) === String(value)) || null

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
            !selected && 'text-muted-foreground',
            className,
          )}
          {...props}
        >
          <span className="min-w-0 flex-1 break-words">
            {selected ? `${selected.name} (${selected.code})` : loading && value ? 'Loading…' : placeholder}
          </span>
          <ChevronsUpDown className="opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[min(18rem,calc(100vw-2rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or code" aria-label="Search internal categories" />
          <CommandList>
            {loading && <div className="text-muted-foreground py-6 text-center text-sm">Loading categories…</div>}
            {error && (
              <div className="text-destructive py-6 text-center text-sm" role="alert">
                Internal categories could not be loaded.
              </div>
            )}
            {!loading && !error && (
              <>
                <CommandEmpty>No internal category found.</CommandEmpty>
                <CommandGroup>
                  {categories.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.code}`}
                      onSelect={() => {
                        onChange(c)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn(String(value) === String(c.id) ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                      <span className="min-w-0 flex-1 break-words">{c.name}</span>
                      <span className="text-muted-foreground font-mono text-xs">{c.code}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
