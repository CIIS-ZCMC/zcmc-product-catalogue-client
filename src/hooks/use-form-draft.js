import { useCallback, useEffect, useRef, useState } from 'react'

const PREFIX = 'zcmc_draft:'
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

function readDraft(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (!draft || typeof draft.savedAt !== 'number' || typeof draft.values !== 'object') return null
    if (Date.now() - draft.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(storageKey)
      return null
    }
    return draft
  } catch {
    return null
  }
}

function writeDraft(storageKey, values) {
  try {
    const savedAt = Date.now()
    localStorage.setItem(storageKey, JSON.stringify({ savedAt, values }))
    return savedAt
  } catch {
    return null // storage full or blocked: autosave quietly does nothing
  }
}

function removeDraft(storageKey) {
  try {
    localStorage.removeItem(storageKey)
  } catch {
    // ignore
  }
}

/**
 * Autosaves a react-hook-form form to localStorage on this device (never to the server, so no
 * product is changed until the user presses Save).
 *
 * - `draftKey`: unique per form and user, e.g. `${userId}:product-create`.
 * - `exclude`: field names that must not be stored (passwords, uploaded-file references).
 * - `restore`: false skips restoring (for example when a prefill should win), but still autosaves.
 * - `isStale(draft)`: return true to drop a draft that is older than the data it was based on.
 *
 * Returns `{ savedAt, restoredAt, clearDraft, discardDraft }`. `clearDraft` removes the stored draft
 * (call it after a successful save); `discardDraft` also resets the form to its defaults.
 */
export function useFormDraft({ form, draftKey, exclude = [], restore = true, isStale, delay = 800 }) {
  const storageKey = `${PREFIX}${draftKey}`
  const [savedAt, setSavedAt] = useState(null)
  const [restoredAt, setRestoredAt] = useState(null)
  const pending = useRef(null)
  const timer = useRef(null)
  const cleared = useRef(false)
  const excludeKey = exclude.join('|')

  const strip = useCallback(
    (values) => {
      const skip = new Set(excludeKey ? excludeKey.split('|') : [])
      return Object.fromEntries(Object.entries(values).filter(([k]) => !skip.has(k)))
    },
    [excludeKey],
  )

  // Restore once on mount.
  useEffect(() => {
    if (!restore) return
    const draft = readDraft(storageKey)
    if (!draft) return
    if (isStale?.(draft)) {
      removeDraft(storageKey)
      return
    }
    // Restored values count as unsaved input, so the leave-page guard still applies.
    const fields = form.getValues()
    Object.entries(strip(draft.values)).forEach(([name, value]) => {
      if (name in fields) form.setValue(name, value, { shouldDirty: true })
    })
    setRestoredAt(draft.savedAt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (pending.current && !cleared.current) {
      const at = writeDraft(storageKey, pending.current)
      if (at) setSavedAt(at)
    }
    pending.current = null
  }, [storageKey])

  // Save shortly after the user stops typing.
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (cleared.current) return
      pending.current = strip(values)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, delay)
    })
    return () => subscription.unsubscribe()
  }, [form, strip, flush, delay])

  // Leaving the page keeps the last keystrokes.
  useEffect(() => {
    const onHide = () => {
      if (pending.current && !cleared.current) writeDraft(storageKey, pending.current)
    }
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      if (pending.current && !cleared.current) writeDraft(storageKey, pending.current)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [storageKey])

  const clearDraft = useCallback(() => {
    cleared.current = true
    pending.current = null
    if (timer.current) clearTimeout(timer.current)
    removeDraft(storageKey)
    setSavedAt(null)
    setRestoredAt(null)
  }, [storageKey])

  const discardDraft = useCallback(() => {
    clearDraft()
    form.reset()
    cleared.current = false // keep autosaving new input after a manual discard
  }, [clearDraft, form])

  return { savedAt, restoredAt, clearDraft, discardDraft }
}
