// UNSPSC classification service. Wraps the server's category endpoints so screens never
// fetch the 158k-row dataset; each search asks the server for small candidate sets and
// ranks them locally with the explainable rules in lib/unspsc.js.

import { api } from './api'
import {
  COMMODITY_LEVEL,
  parseQuery,
  rankCommodities,
  serverTerm,
  toCommodity,
} from '@/lib/unspsc'

// How many candidates to request per word. The server matches each word with LIKE and
// returns rows in table order, so a cap that is hit means more matches may exist.
const CANDIDATES_PER_TERM = 60
const MAX_SERVER_TERMS = 3

/**
 * Searches commodities by code, title words or a product description.
 * Resolves to { query, results: [{ item, score, strength, reasons }], truncated, suggestions }.
 * `suggestions` is true when the query was empty and the server's starter list was returned.
 */
export async function searchCommodities(raw, { signal, limit = 30 } = {}) {
  const query = parseQuery(raw)

  if (query.kind === 'empty') {
    if (query.text)
      return { query, results: [], truncated: false, suggestions: false }
    const starters = await api.getCommodities('', { signal })
    const results = (Array.isArray(starters) ? starters : []).map((c) => ({
      item: toCommodity(c),
      score: 0,
      strength: null,
      reasons: [],
    }))
    return { query, results, truncated: false, suggestions: true }
  }

  // Longest words first: they are the most specific and keep candidate lists small.
  const terms =
    query.kind === 'code'
      ? [query.code]
      : [
          ...new Set(
            [...query.terms].sort((a, b) => b.length - a.length).map(serverTerm)
          ),
        ].slice(0, MAX_SERVER_TERMS)

  const responses = await Promise.all(
    terms.map((t) =>
      api.getCommodities(t, { signal }, { limit: CANDIDATES_PER_TERM })
    )
  )

  const byKey = new Map()
  let truncated = false
  responses.forEach((list) => {
    const rows = Array.isArray(list) ? list : []
    if (rows.length >= CANDIDATES_PER_TERM) truncated = true
    rows.forEach((row) => {
      if (!byKey.has(row.key)) byKey.set(row.key, toCommodity(row))
    })
  })

  const results = rankCommodities([...byKey.values()], query).slice(0, limit)
  return { query, results, truncated, suggestions: false }
}

/** Loads one category with its full hierarchy (GET /categories/:key). */
export async function getCommodity(key, { signal } = {}) {
  const res = await api.getCategory(key, { signal })
  const category = res?.category || res
  return toCommodity({ ...category, ancestors: res?.ancestors || [] })
}

// Segments and children change only when an admin edits the tree, so cache them per page load.
let segmentsPromise = null
const childrenCache = new Map()

export function getSegments() {
  if (!segmentsPromise) {
    segmentsPromise = api.getRootCategories().catch((err) => {
      segmentsPromise = null
      throw err
    })
  }
  return segmentsPromise
}

export function getChildren(key) {
  if (!childrenCache.has(key)) {
    childrenCache.set(
      key,
      api.getCategoryChildren(key).catch((err) => {
        childrenCache.delete(key)
        throw err
      })
    )
  }
  return childrenCache.get(key)
}

export function isCommodity(node) {
  return (node?.level ?? -1) >= COMMODITY_LEVEL
}
