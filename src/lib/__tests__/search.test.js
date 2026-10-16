import { describe, expect, it } from 'vitest'
import { filterOptions, tokenize } from '../search'

const units = ['Box', 'Bottle', 'Prefilled Syringe', 'Syringe', 'Vial']
const aliases = { Bottle: 'bot btl', 'Prefilled Syringe': 'pfs' }
const opts = { getLabel: (u) => u, getSearchText: (u) => `${u} ${aliases[u] || ''}` }

describe('tokenize', () => {
  it('lowercases, strips accents and keeps decimals and percentages', () => {
    expect(tokenize('Sodium Hypochlorite 5.25%, Café')).toEqual(['sodium', 'hypochlorite', '5.25%', 'cafe'])
  })
})

describe('filterOptions', () => {
  it('returns everything for an empty query', () => {
    expect(filterOptions(units, '  ', opts)).toEqual(units)
  })

  it('matches aliases as well as labels', () => {
    expect(filterOptions(units, 'pfs', opts)).toEqual(['Prefilled Syringe'])
    expect(filterOptions(units, 'btl', opts)).toEqual(['Bottle'])
  })

  it('requires every word and puts exact and prefix matches first', () => {
    expect(filterOptions(units, 'syringe', opts)).toEqual(['Syringe', 'Prefilled Syringe'])
    expect(filterOptions(units, 'prefilled syr', opts)).toEqual(['Prefilled Syringe'])
  })

  it('ranks code matches with getCode', () => {
    const cats = [
      { name: 'Medical supplies', code: 'ME-SUP' },
      { name: 'Office supplies', code: 'OF-SUP' },
    ]
    const result = filterOptions(cats, 'of-sup', {
      getLabel: (c) => c.name,
      getCode: (c) => c.code,
      getSearchText: (c) => `${c.name} ${c.code}`,
    })
    expect(result.map((c) => c.code)).toEqual(['OF-SUP'])
  })
})
