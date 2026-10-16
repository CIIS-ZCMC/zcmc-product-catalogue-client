import { useCallback, useEffect, useState } from 'react'
import { api } from '@/services/api'

/** Loads one product via GET /products/:id ({ product, category_path, category_hierarchy, price_history }). */
export function useProduct(id) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [token, setToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', data: null, error: null })
    api
      .getProduct(id, { signal: controller.signal })
      .then((data) => setState({ status: 'success', data, error: null }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setState({ status: 'error', data: null, error })
      })
    return () => controller.abort()
  }, [id, token])

  const reload = useCallback(() => setToken((n) => n + 1), [])
  return { ...state, reload }
}
