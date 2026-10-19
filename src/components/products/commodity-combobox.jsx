import { commodityText, parentPath } from '@/lib/unspsc'
import { searchCommodities } from '@/services/unspsc-service'
import { SearchableSelect } from '@/components/ui/searchable-select'

const getValue = (c) => String(c.key)

// Module-level so its identity is stable for SearchableSelect's request effect.
async function loadCommodities(query, { signal }) {
  const { results } = await searchCommodities(query, { signal })
  return results.map((r) => ({
    ...r.item,
    match: { strength: r.strength, reasons: r.reasons },
  }))
}

/**
 * Compact UNSPSC commodity picker for filters. Uses the same ranked search as the
 * classification assistant. `value` is { key, code, title } or null.
 */
export function CommodityCombobox({
  value,
  onChange,
  placeholder = 'Search UNSPSC commodity…',
  ...props
}) {
  return (
    <SearchableSelect
      value={value}
      onChange={(c) =>
        onChange(c ? { key: c.key, code: c.code, title: c.title } : null)
      }
      loadOptions={loadCommodities}
      getOptionValue={getValue}
      getOptionLabel={commodityText}
      renderOption={(c) => {
        const path = parentPath(c)
        return (
          <>
            <span className="block font-medium">{commodityText(c)}</span>
            {path && (
              <span className="text-muted-foreground block text-xs">
                {path}
              </span>
            )}
          </>
        )
      }}
      groupHeading={(q) => (q ? 'Best matches first' : 'Common commodities')}
      placeholder={placeholder}
      searchPlaceholder="Commodity words or code, e.g. nitrile gloves"
      searchLabel="Search UNSPSC commodities"
      emptyMessage={(q) =>
        `No commodity matches “${q}”. Try fewer or more general words.`
      }
      clearLabel="Clear UNSPSC category"
      {...props}
    />
  )
}
