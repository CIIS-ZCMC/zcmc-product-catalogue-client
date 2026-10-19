import { useCallback, useEffect, useState } from 'react'
import { api } from '@/services/api'

/**
 * Server-paginated product list. Each new query aborts the previous request,
 * so a slow, stale response can never overwrite a newer one.
 */
export function useProducts(query) {
  const [state, setState] = useState({
    status: 'loading',
    products: [],
    meta: null,
    error: null,
  })
  const [reloadToken, setReloadToken] = useState(0)
  // Serialised so a new object with the same values does not trigger a refetch.
  const key = JSON.stringify(query)

  useEffect(() => {
    const params = JSON.parse(key)
    const controller = new AbortController()
    setState((prev) => ({
      ...prev,
      status: prev.meta ? 'refreshing' : 'loading',
      error: null,
    }))

    api
      .getProducts(params, { signal: controller.signal })
      .then((res) => {
        setState({
          status: 'success',
          products: Array.isArray(res?.data) ? res.data : [],
          meta: {
            currentPage: res?.current_page ?? 1,
            lastPage: res?.last_page ?? 1,
            perPage: res?.per_page ?? params.per_page,
            total: typeof res?.total === 'number' ? res.total : null,
            from: res?.from ?? null,
            to: res?.to ?? null,
          },
          error: null,
        })
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        setState((prev) => ({ ...prev, status: 'error', error }))
      })

    return () => controller.abort()
  }, [key, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  return { ...state, reload }
}
