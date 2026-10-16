import { useId } from 'react'

import { useUnits } from '@/hooks/use-lookups'
import { SORT_OPTIONS } from '@/lib/product-list-options'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CommodityCombobox } from './commodity-combobox'
import { InternalCategoryCombobox } from './internal-category-combobox'

const ALL = '__all__'

/**
 * Filters backed by real query params of GET /products:
 * internal_category_id, category_key (any UNSPSC level), uom.
 */
export function ProductFilters({ filters, commodity, onChange, sort, onSortChange, showSort = false, layout = 'row' }) {
  const units = useUnits()
  const id = useId()
  const sortValue = `${sort.by}:${sort.order}`
  const knownSort = SORT_OPTIONS.some((o) => o.value === sortValue)

  return (
    <div className={layout === 'row' ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_12rem]' : 'grid gap-4'}>
      <div className="grid min-w-0 gap-1.5">
        <Label htmlFor={`${id}-internal`}>Internal category</Label>
        <InternalCategoryCombobox
          id={`${id}-internal`}
          value={filters.internal_category_id || null}
          onChange={(c) => onChange({ internal_category_id: c ? String(c.id) : '' })}
          placeholder="All internal categories"
        />
      </div>
      <div className="grid min-w-0 gap-1.5">
        <Label htmlFor={`${id}-commodity`}>UNSPSC category</Label>
        <CommodityCombobox
          id={`${id}-commodity`}
          value={commodity}
          onChange={(c) => onChange({ category_key: c ? String(c.key) : '' }, c)}
          placeholder="All UNSPSC categories"
        />
      </div>
      <div className="grid min-w-0 gap-1.5">
        <Label htmlFor={`${id}-uom`}>Unit of measure</Label>
        <Select value={filters.uom || ALL} onValueChange={(v) => onChange({ uom: v === ALL ? '' : v })}>
          <SelectTrigger id={`${id}-uom`}>
            <SelectValue placeholder="All units" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={ALL}>All units</SelectItem>
            {units.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showSort && (
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-sort`}>Sort by</Label>
          <Select
            value={knownSort ? sortValue : 'created_at:desc'}
            onValueChange={(v) => {
              const [by, order] = v.split(':')
              onSortChange({ by, order })
            }}
          >
            <SelectTrigger id={`${id}-sort`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
