import { describe, expect, it } from 'vitest'
import {
  isAmbiguous,
  parseQuery,
  rankCommodities,
  serverTerm,
  stem,
  toCommodity,
} from '../unspsc'

// Shapes copied from CategoryService::searchCommodities; titles are real UNSPSC entries.
const gloves = toCommodity({
  key: 1,
  code: '42132203',
  title: 'Medical exam or non surgical procedure gloves',
  definition: 'Gloves used for medical examinations.',
  hierarchy: [
    {
      key: 10,
      code: '42000000',
      title: 'Medical Equipment and Accessories and Supplies',
      level: 0,
    },
    {
      key: 11,
      code: '42130000',
      title: 'Medical fabrics and textiles',
      level: 1,
    },
    {
      key: 12,
      code: '42132200',
      title: 'Medical gloves and accessories',
      level: 2,
    },
    {
      key: 1,
      code: '42132203',
      title: 'Medical exam or non surgical procedure gloves',
      level: 3,
    },
  ],
})
const surgical = toCommodity({
  key: 2,
  code: '42132205',
  title: 'Surgical gloves',
  hierarchy: gloves.hierarchy.slice(0, 3),
})
const garden = toCommodity({
  key: 3,
  code: '46181504',
  title: 'Protective gloves',
  definition: 'Nitrile or leather.',
})
const paper = toCommodity({
  key: 4,
  code: '14111507',
  title: 'Printer or copier paper',
})

describe('parseQuery', () => {
  it('recognises codes, including spaced ones', () => {
    expect(parseQuery('4213 2203')).toMatchObject({
      kind: 'code',
      code: '42132203',
    })
    expect(parseQuery('42')).toMatchObject({ kind: 'code', code: '42' })
  })

  it('drops stop words, numbers and sizes from text queries', () => {
    expect(
      parseQuery('GLOVES, EXAMINATION, NITRILE, MEDIUM, 100 PCS').terms
    ).toEqual(['gloves', 'examination', 'nitrile'])
    expect(parseQuery('5.25%').kind).toBe('empty')
  })
})

describe('stem and serverTerm', () => {
  it('reduces simple plurals', () => {
    expect(stem('gloves')).toBe('glove')
    expect(stem('batteries')).toBe('battery')
    expect(stem('boxes')).toBe('box')
    expect(stem('glass')).toBe('glass')
  })

  it('gives a LIKE term that still matches singular and plural titles', () => {
    expect(serverTerm('batteries')).toBe('batter')
    expect(serverTerm('syringes')).toBe('syring')
    expect(serverTerm('gloves')).toBe('glove')
  })
})

describe('rankCommodities', () => {
  it('ranks an exact code first and explains why', () => {
    const [top] = rankCommodities(
      [surgical, gloves, paper],
      parseQuery('42132203')
    )
    expect(top.item.code).toBe('42132203')
    expect(top.reasons).toContain('Code matches exactly')
  })

  it('treats a code prefix as a hierarchy match', () => {
    const ranked = rankCommodities(
      [gloves, surgical, paper],
      parseQuery('421322')
    )
    expect(ranked.map((r) => r.item.code)).toEqual(['42132203', '42132205'])
    expect(ranked[0].reasons[0]).toBe('In class 421322')
  })

  it('prefers titles containing every word and labels strength', () => {
    const ranked = rankCommodities(
      [garden, surgical, gloves, paper],
      parseQuery('surgical gloves')
    )
    expect(ranked[0].item.code).toBe('42132205')
    expect(ranked[0].strength).toBe('strong')
    expect(ranked[0].reasons).toContain('Title has every search word')
    expect(ranked.find((r) => r.item.code === '14111507')).toBeUndefined()
  })

  it('uses parent categories and definitions as weaker evidence', () => {
    const ranked = rankCommodities(
      [garden, gloves],
      parseQuery('nitrile medical gloves')
    )
    const exam = ranked.find((r) => r.item.code === '42132203')
    const protective = ranked.find((r) => r.item.code === '46181504')
    expect(exam.reasons.join(' ')).toMatch(/Title has/)
    expect(protective.reasons.join(' ')).toMatch(
      /Definition mentions “nitrile”/
    )
    expect(exam.strength).toBe('partial')
  })

  it('returns nothing rather than guessing when no candidate matches', () => {
    expect(rankCommodities([paper], parseQuery('defibrillator'))).toEqual([])
  })
})

describe('isAmbiguous', () => {
  it('flags close results of equal strength', () => {
    const a = { score: 50, strength: 'strong' }
    const b = { score: 48, strength: 'strong' }
    expect(isAmbiguous([a, b])).toBe(true)
    expect(isAmbiguous([a, { score: 20, strength: 'partial' }])).toBe(false)
    expect(isAmbiguous([a])).toBe(false)
  })
})

describe('toCommodity', () => {
  it('builds the hierarchy from /categories/:key ancestors', () => {
    const c = toCommodity({
      key: 5,
      code: '1',
      title: 'X',
      level: 3,
      ancestors: [{ key: 6, code: '0', title: 'P', level: 2 }],
    })
    expect(c.hierarchy.map((h) => h.key)).toEqual([6, 5])
  })
})

describe('word versus prefix matches', () => {
  it('ranks a whole-word title above a longer word that only starts with the query', () => {
    const meter = toCommodity({
      key: 7,
      code: '41113038',
      title: 'Alcoholometer',
    })
    const solvent = toCommodity({
      key: 8,
      code: '12191601',
      title: 'Alcohol solvents',
    })
    const ranked = rankCommodities([meter, solvent], parseQuery('alcohol'))
    expect(ranked.map((r) => r.item.code)).toEqual(['12191601', '41113038'])
    expect(ranked[1].strength).toBe('partial')
  })

  it('ignores a word negated with "non"', () => {
    const non = toCommodity({
      key: 9,
      code: '42132209',
      title: 'Non-nitrile exam or non-surgical gloves',
    })
    const nit = toCommodity({
      key: 10,
      code: '42132203',
      title: 'Nitrile medical exam or non surgical procedure gloves',
    })
    const ranked = rankCommodities(
      [non, nit],
      parseQuery('GLOVES, EXAMINATION, NITRILE')
    )
    expect(ranked[0].item.code).toBe('42132203')
    expect(ranked[0].strength).toBe('strong')
    expect(ranked[1].strength).toBe('partial')
  })
})
