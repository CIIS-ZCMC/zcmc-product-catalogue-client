export const PAGE_SIZES = [15, 25, 50, 100]

// Sort fields accepted by ProductService::listProducts on the server.
export const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'item_description:asc', label: 'Description A–Z' },
  { value: 'item_description:desc', label: 'Description Z–A' },
  { value: 'erp_item_code:asc', label: 'ERP code A–Z' },
  { value: 'erp_item_code:desc', label: 'ERP code Z–A' },
  { value: 'uom:asc', label: 'UOM A–Z' },
]
