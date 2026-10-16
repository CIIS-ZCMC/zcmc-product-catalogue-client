import { useLocation } from 'react-router'

/** Returns to the list view the user came from (filters, sort and page kept), or to /products. */
export function useReturnTo(fallback = '/products') {
  const location = useLocation()
  const from = location.state?.from
  return typeof from === 'string' && from.startsWith('/products') ? from : fallback
}
