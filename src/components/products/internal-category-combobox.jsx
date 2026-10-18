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
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 break-words">{c.name}</span>
          <span className="text-muted-foreground shrink-0 font-mono text-xs">{c.code}</span>
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
