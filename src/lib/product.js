// Product domain helpers shared by the shadcn product screens.
// Field names mirror the server's Product model and Store/UpdateProductRequest
// (zcmc-product-catalogue-server). Do not add fields here that the API does not return.

export const EMPTY_VALUE = '—'

export const PHILGEPS_DIRECTORY_URL =
  'https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items'

// Fallback used only when /item-units fails or is empty (same list as the MUI screens).
export const FALLBACK_UNITS = [
  'Ampule',
  'Account',
  'Assembly',
  'Bag',
  'Bar',
  'Bot',
  'Bottle',
  'Booklet',
  'Box',
  'Bundle',
  'Can',
  'Capsule',
  'Card',
  'Cart',
  'Cartridge',
  'Case',
  'Cycle',
  'Drum',
  'Ft2',
  'Gallon',
  'GBq',
  'Jar',
  'Kg',
  'Kilo',
  'Kit',
  'Kits',
  'Liter',
  'Loaf',
  'Lot',
  'mCi',
  'Meter',
  'Month',
  'Nebule',
  'Pack',
  'Pad',
  'Pail',
  'Pair',
  'Pax',
  'Pfs',
  'Piece',
  'Plate',
  'Rack',
  'Ream',
  'Roll',
  'Sachet',
  'Sack',
  'Seat',
  'Set',
  'Sheet',
  'Spool',
  'System',
  'Solution',
  'Tablet',
  'Tank',
  'Test',
  'Tin',
  'Tray',
  'Tube',
  'Unit',
  'Vial',
  'Inhaler',
  'MDI',
  'Prefilled Syringe',
  'Syringe',
  'Length',
  'Letter',
  'Infusion set',
].sort((a, b) => a.localeCompare(b))

// Order matches Product::buildStandardName on the server.
export const NAMING_FIELDS = [
  'noun',
  'type',
  'material_composition',
  'key_attributes',
  'size',
]

export function buildStandardName(values) {
  return NAMING_FIELDS.map((f) => (values[f] || '').trim().toUpperCase())
    .filter(Boolean)
    .join(', ')
}

export function display(value) {
  if (value === null || value === undefined) return EMPTY_VALUE
  const str = String(value).trim()
  return str === '' ? EMPTY_VALUE : str
}

export function splitSpecs(raw) {
  return (raw || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

const dateFormatter = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

export function formatDate(value, withTime = false) {
  if (!value) return EMPTY_VALUE
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return EMPTY_VALUE
  return (withTime ? dateTimeFormatter : dateFormatter).format(d)
}

export function formatPeso(value) {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE
  const n = Number(value)
  return Number.isFinite(n) ? pesoFormatter.format(n) : EMPTY_VALUE
}

export function internalCategoryLabel(product) {
  if (product?.internal_category) {
    return `${product.internal_category.name} (${product.internal_category.code})`
  }
  return display(product?.internal_category_code)
}

/** Label for the product's assigned UNSPSC commodity, e.g. "[44121704] Ballpoint pens". */
export function commodityLabel(product) {
  const title = product?.subcategory || product?.category_relation?.title
  const code = product?.unspsc_code || product?.category_relation?.code
  if (!title && !code) return EMPTY_VALUE
  return code ? `[${code}] ${title || ''}`.trim() : title
}

/** Label for a commodity option ({ code, title }). */
export function commodityText(c) {
  if (!c) return ''
  return c.code ? `[${c.code}] ${c.title || ''}`.trim() : c.title || ''
}
