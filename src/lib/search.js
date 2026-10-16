// Small, dependency-free text matching shared by searchable pickers.

export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
}

/** Splits text into lowercase words; keeps "." and "%" so values like 5.25% stay whole. */
export function tokenize(value) {
  return normalize(value)
    .split(/[^a-z0-9.%]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean)
}

/**
 * Filters options locally: every typed word must appear somewhere in the option's
 * search text (label, code, aliases). Results keep their order except that exact
 * and prefix label/code matches move to the top.
 */
export function filterOptions(options, query, { getSearchText, getLabel, getCode } = {}) {
  const terms = tokenize(query)
  if (terms.length === 0) return options
  const text = getSearchText || getLabel || String
  const phrase = normalize(query).trim()

  const scored = []
  options.forEach((option, index) => {
    const haystack = normalize(text(option))
    if (!terms.every((t) => haystack.includes(t))) return
    const label = normalize(getLabel ? getLabel(option) : '')
    const code = normalize(getCode ? getCode(option) : '')
    let rank = 3
    if (label === phrase || code === phrase) rank = 0
    else if (label.startsWith(phrase) || (code && code.startsWith(phrase))) rank = 1
    else if (tokenize(label).some((w) => w.startsWith(terms[0]))) rank = 2
    scored.push({ option, rank, index })
  })

  return scored.sort((a, b) => a.rank - b.rank || a.index - b.index).map((s) => s.option)
}
