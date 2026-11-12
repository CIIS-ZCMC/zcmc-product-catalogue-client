import { useAuth } from '@/context/auth-context'
import { useInternalCategories } from '@/hooks/use-lookups'
import { SearchableSelect } from '@/components/ui/searchable-select'

const getValue = (c) => String(c.id)
const getLabel = (c) => `${c.name} (${c.code})`
const getCode = (c) => c.code
const getSearchText = (c) => `${c.name} ${c.code} ${c.description || ''}`

/**
 * Searchable picker for ZCMC internal categories (GET /internal-categories, about 30 rows,
 * so filtering is local). `value` is the category id or null; `onChange` gets the category or null.
 * `onlyManageable` limits the choices to the categories the signed-in user may write to (encoders).
 */
export function InternalCategoryCombobox({
  value,
  onChange,
  placeholder = 'Select internal category',
  onlyManageable = false,
  ...props
}) {
  const { canManageCategory } = useAuth()
  const { data: categories, loading, error } = useInternalCategories()
  const options = onlyManageable ? categories.filter((c) => canManageCategory(c.id)) : categories
  const selected = categories.find((c) => String(c.id) === String(value)) || null
  // Keep the trigger informative while the list loads for an existing value.
  const pendingValue = !selected && value !== null && value !== undefined && value !== '' && loading

  return (
    <SearchableSelect
      value={selected}
      onChange={onChange}
      options={options}
      loading={loading}
      error={error}
      getOptionValue={getValue}
      getOptionLabel={getLabel}
      getOptionCode={getCode}
      getSearchText={getSearchText}
      renderOption={(c) => (
        <span className="flex items-start justify-between gap-3 w-full">
          <span className="min-w-0 break-words font-medium">{c.name}</span>
          <span className="flex shrink-0 items-center gap-2 font-mono text-xs">
            {c.products_count !== undefined && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-sans text-muted-foreground">
                {c.products_count} {c.products_count === 1 ? 'item' : 'items'}
              </span>
            )}
            <span className="text-muted-foreground">{c.code}</span>
          </span>
        </span>
      )}
      placeholder={pendingValue ? 'Loading…' : placeholder}
      searchPlaceholder="Search by name or code, e.g. OF-SUP"
      searchLabel="Search internal categories"
      emptyMessage={(q) => (q ? `No internal category matches “${q}”.` : onlyManageable ? 'No internal category is assigned to your account. Ask an administrator.' : 'No internal categories are set up on the server.')}
      clearLabel="Clear internal category"
      {...props}
    />
  )
}
