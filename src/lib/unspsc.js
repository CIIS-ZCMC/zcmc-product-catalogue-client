// UNSPSC classification helpers: query parsing, explainable ranking and result shaping.
// Ranking runs on candidates the server already returned; it never invents codes or titles.

import { normalize, tokenize } from './search'

export const LEVEL_NAMES = ['Segment', 'Family', 'Class', 'Commodity']
export const COMMODITY_LEVEL = 3

/**
 * Where the classification data comes from. The server seeds `categories` from
 * database/data/unspsc_categories.csv, generated from a UNGM "unspsc_english.xlsx"
 * export. That file does not record a UNSPSC version, so none is shown or stored.
 */
export const UNSPSC_SOURCE = {
  name: 'UNSPSC (English)',
  origin: 'UNGM export loaded on the catalogue server',
  version: null,
}

// Words that carry no classification meaning in item names or searches.
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'or', 'the', 'of', 'for', 'with', 'without', 'in', 'on', 'to', 'by', 'per', 'at', 'as',
  'pc', 'pcs', 'piece', 'pieces', 'unit', 'units', 'type', 'size', 'other',
  // Units and sizes: UNSPSC titles never include them.
  'ml', 'mg', 'mcg', 'kg', 'gm', 'cc', 'iu', 'cm', 'mm', 'gsm', 'oz', 'ft', 'lb', 'ltr',
  'small', 'medium', 'large', 'xl', 'xs', 'xxl',
])

/** Reduces simple English plurals so "gloves" matches "glove" and "batteries" matches "battery". */
export function stem(word) {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 4 && /(ch|sh|x|ss|zz)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** Shortest safe substring for the server's LIKE search ("battery" → "batter" finds "batteries"). */
export function serverTerm(word) {
  const s = stem(word)
  return s.length > 5 && /[ye]$/.test(s) ? s.slice(0, -1) : s
}

/**
 * Turns what the user typed into either a code lookup ("4213", "42 13 22 03")
 * or a list of meaningful words. Words containing digits (sizes, strengths) are dropped
 * from text matching because UNSPSC titles do not carry them.
 */
export function parseQuery(raw) {
  const text = String(raw ?? '').trim()
  const compact = text.replace(/[\s-]+/g, '')
  if (/^\d{2,8}$/.test(compact)) return { kind: 'code', text, code: compact, terms: [], phrase: '' }
  const terms = [...new Set(tokenize(text).filter((t) => t.length >= 2 && !STOP_WORDS.has(t) && !/\d/.test(t)))]
  return { kind: terms.length ? 'text' : 'empty', text, code: null, terms, phrase: terms.join(' ') }
}

/** Stemmed words of a title; a word negated by "non" ("Non-nitrile") is left out so it cannot match. */
function wordsOf(value) {
  const words = tokenize(value)
  return words.filter((w, i) => w !== 'non' && words[i - 1] !== 'non').map(stem)
}

/**
 * 'word': whole word, or a title abbreviation of the typed word ("exam" for "examination").
 * 'prefix': the typed word starts a longer title word ("syring" → "syringe", "alcohol" → "alcoholometer").
 */
function termMatch(words, term) {
  const t = stem(term)
  if (words.some((w) => w === t || (w.length >= 4 && t.startsWith(w)))) return 'word'
  if (t.length >= 4 && words.some((w) => w.startsWith(t))) return 'prefix'
  return null
}

const hasTerm = (words, term) => termMatch(words, term) !== null

const quote = (t) => `“${t}”`

function levelForCodePrefix(length) {
  if (length <= 2) return 'segment'
  if (length <= 4) return 'family'
  if (length <= 6) return 'class'
  return 'commodity'
}

/**
 * Scores one commodity against a parsed query. Every point comes with a reason a user
 * can read, so results can be explained instead of trusted blindly.
 */
export function scoreCommodity(item, query) {
  const reasons = []
  let score = 0
  let titleMatches = []

  if (query.kind === 'code') {
    const code = item.code || ''
    if (code === query.code) {
      score += 100
      reasons.push('Code matches exactly')
    } else if (code.startsWith(query.code)) {
      score += 60
      reasons.push(`In ${levelForCodePrefix(query.code.length)} ${query.code}`)
    } else if (code.includes(query.code)) {
      score += 10
      reasons.push(`Code contains ${query.code}`)
    }
    return { item, score, coverage: score > 0 ? 1 : 0, partialWords: false, reasons, matchedTerms: [] }
  }

  if (query.kind !== 'text') return { item, score: 0, coverage: 0, partialWords: false, reasons, matchedTerms: [] }

  const titleWords = wordsOf(item.title)
  const kinds = query.terms.map((t) => termMatch(titleWords, t))
  titleMatches = query.terms.filter((_, i) => kinds[i])
  const prefixOnly = query.terms.filter((_, i) => kinds[i] === 'prefix')
  const coverage = titleMatches.length / query.terms.length

  // Whole words count more than the start of a longer word.
  score += kinds.reduce((sum, k) => sum + (k === 'word' ? 20 : k === 'prefix' ? 12 : 0), 0)
  // The first word of a ZCMC standard name is the noun, the strongest signal.
  if (titleMatches.includes(query.terms[0])) score += 10
  if (titleMatches.length > 0) {
    if (coverage === 1 && query.terms.length > 1) {
      score += 25
      reasons.push('Title has every search word')
    } else {
      reasons.push(`Title has ${titleMatches.map(quote).join(', ')}`)
    }
    if (prefixOnly.length) reasons.push(`${prefixOnly.map(quote).join(', ')} only as the start of a longer word`)
  }
  if (query.terms.length > 1 && normalize(item.title).includes(query.phrase)) {
    score += 15
    reasons.push('Exact phrase in title')
  }

  const rest = query.terms.filter((t) => !titleMatches.includes(t))
  const parents = (item.hierarchy || []).filter((h) => h.level < COMMODITY_LEVEL)
  const parentWords = wordsOf(parents.map((h) => h.title).join(' '))
  const inParents = rest.filter((t) => hasTerm(parentWords, t))
  if (inParents.length) {
    score += inParents.length * 6
    reasons.push(`Parent category has ${inParents.map(quote).join(', ')}`)
  }

  const definitionWords = wordsOf(item.definition)
  const inDefinition = rest.filter((t) => !inParents.includes(t) && hasTerm(definitionWords, t))
  if (inDefinition.length) {
    score += inDefinition.length * 3
    reasons.push(`Definition mentions ${inDefinition.map(quote).join(', ')}`)
  }

  // Tie-break only: prefer shorter, more specific titles.
  if (score > 0) score -= Math.min(titleWords.length, 20) * 0.25

  return { item, score, coverage, partialWords: prefixOnly.length > 0, reasons, matchedTerms: titleMatches }
}

/**
 * strong: every word appears whole in the title (or the code matches); partial: some words,
 * or only word starts; weak: found only in parent categories or the definition.
 */
export function matchStrength(result) {
  if (result.coverage === 1 && !result.partialWords) return 'strong'
  if (result.matchedTerms.length > 0) return 'partial'
  return 'weak'
}

export function rankCommodities(items, query) {
  return items
    .map((item) => scoreCommodity(item, query))
    .filter((r) => r.score > 0)
    .map((r) => ({ ...r, strength: matchStrength(r) }))
    .sort((a, b) => b.score - a.score || String(a.item.code).localeCompare(String(b.item.code)))
}

/** True when the top results are equally good, so the user should compare before choosing. */
export function isAmbiguous(ranked) {
  if (ranked.length < 2) return false
  const [first, second] = ranked
  return first.strength === second.strength && first.strength !== 'weak' && first.score - second.score < 5
}

/**
 * Normalises the different server shapes (commodity search, /categories/:key, children)
 * into { key, code, title, level, definition, hierarchy[] } where hierarchy runs segment → self.
 */
export function toCommodity(raw, parents = []) {
  if (!raw) return null
  const self = { key: raw.key, code: raw.code || '', title: raw.title || '', level: raw.level ?? COMMODITY_LEVEL }
  let hierarchy
  if (Array.isArray(raw.hierarchy) && raw.hierarchy.length) hierarchy = raw.hierarchy
  else if (Array.isArray(raw.ancestors)) hierarchy = [...raw.ancestors, self]
  else hierarchy = [...parents, self]
  return { ...self, definition: raw.definition || '', hierarchy }
}

export { commodityText } from './product'

/** "Segment › Family › Class" for a commodity's parents. */
export function parentPath(c) {
  return (c?.hierarchy || [])
    .filter((h) => h.level < (c.level ?? COMMODITY_LEVEL))
    .map((h) => h.title)
    .join(' › ')
}
