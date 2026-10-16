import { useEffect, useState } from 'react'

import { searchCommodities } from '@/services/unspsc-service'
import { useDebouncedValue } from './use-debounced-value'

/**
 * Debounced, cancellable UNSPSC commodity search. Results are tagged with the query that
 * produced them, so an older response can never be shown for a newer query.
 */
export function useUnspscSearch(text, { enabled = true, delay = 350 } = {}) {
  const debounced = useDebouncedValue(text.trim(), delay)
  const [result, setResult] = useState({ query: null, data: null, error: null })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()
    searchCommodities(debounced, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ query: debounced, data, error: null })
      })
      .catch((error) => {
        if (error?.name !== 'AbortError' && !controller.signal.aborted) {
          setResult({ query: debounced, data: null, error })
        }
      })
    return () => controller.abort()
  }, [debounced, enabled, retryToken])

  const current = result.query === debounced
  return {
    query: debounced,
    // Typing or waiting for the server: keep the previous list visible but marked stale.
    pending: !current || text.trim() !== debounced,
    data: result.data,
    stale: !current,
    error: current ? result.error : null,
    retry: () => setRetryToken((n) => n + 1),
  }
}
