import { SearchableSelect } from '@/components/ui/searchable-select'

const identity = (u) => u

// Common abbreviations staff type that do not appear in the unit names themselves.
const ALIASES = {
  Piece: 'pc pcs',
  Bottle: 'bot btl',
  Bot: 'bottle',
  Liter: 'litre l',
  Kilo: 'kg kilogram',
  Kg: 'kilo kilogram',
  Meter: 'metre m',
  Ampule: 'ampoule amp',
  'Prefilled Syringe': 'pfs',
  Pfs: 'prefilled syringe',
}

/**
 * Unit of measure picker. Units come from GET /item-units (about 65 names, stored as the
 * name itself), so filtering is local and instant. `value` and `onChange` use the unit name.
 */
export function UnitSelect({ value, onChange, units, ...props }) {
  return (
    <SearchableSelect
      value={value || null}
      onChange={(u) => onChange(u || '')}
      options={units}
      getOptionValue={identity}
      getOptionLabel={identity}
      getSearchText={(u) => `${u} ${ALIASES[u] || ''}`}
      placeholder="Select unit"
      searchPlaceholder="Search units, e.g. box, vial"
      searchLabel="Search units of measure"
      emptyMessage={(q) =>
        `No unit matches “${q}”. Ask an administrator to add it on the server.`
      }
      clearLabel="Clear unit"
      {...props}
    />
  )
}
