import { useCallback, useEffect, useState } from 'react'
import { api } from '@/services/api'

const toMeta = (res, params) => ({
  currentPage: res?.current_page ?? 1,
  lastPage: res?.last_page ?? 1,
  perPage: res?.per_page ?? params.per_page,
  total: typeof res?.total === 'number' ? res.total : null,
  from: res?.from ?? null,
  to: res?.to ?? null,
})

/**
 * Server-paginated user list (administrators only). Each new query aborts the previous
 * request, so a slow, stale response can never overwrite a newer one.
 * Pass `null` to skip fetching (for example when the viewer is not an administrator).
 *
 * `status` is derived: it is 'loading' until a result exists, and 'refreshing' while a newer
 * query is in flight (the previous rows stay visible, so the table does not flash).
 */
export function useUsers(query) {
  const [result, setResult] = useState({ key: null, users: [], meta: null, error: null })
  const [reloadToken, setReloadToken] = useState(0)
  const key = JSON.stringify(query)

  useEffect(() => {
    const params = JSON.parse(key)
    if (params === null) return undefined
    const controller = new AbortController()

    api
      .getUsers(params, { signal: controller.signal })
      .then((res) => {
        setResult({
          key: `${key}#${reloadToken}`,
          users: Array.isArray(res?.data) ? res.data : [],
          meta: toMeta(res, params),
          error: null,
        })
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        setResult((prev) => ({ ...prev, key: `${key}#${reloadToken}`, error }))
      })

    return () => controller.abort()
  }, [key, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  const current = result.key === `${key}#${reloadToken}`
  let status = 'success'
  if (current) status = result.error ? 'error' : 'success'
  else status = result.meta ? 'refreshing' : 'loading'

  return { status, users: result.users, meta: result.meta, error: result.error, reload }
}
