import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({ api: { getCommodities: vi.fn() } }))

import { api } from '../api'
import { searchCommodities } from '../unspsc-service'

const row = (key, code, title) => ({ key, code, title, level: 3, hierarchy: [{ key, code, title, level: 3 }] })

describe('searchCommodities', () => {
  beforeEach(() => api.getCommodities.mockReset())

  it('queries the server once per meaningful word and merges duplicates', async () => {
    api.getCommodities.mockImplementation(async (term) =>
      term === 'nitrile' ? [row(1, '42132203', 'Nitrile exam gloves')] : [row(1, '42132203', 'Nitrile exam gloves'), row(2, '42132205', 'Surgical gloves')],
    )
    const { results, truncated } = await searchCommodities('GLOVES, EXAMINATION, NITRILE, MEDIUM, 100 PCS')
    const terms = api.getCommodities.mock.calls.map((c) => c[0]).sort()
    expect(terms).toEqual(['examination', 'glove', 'nitril'])
    expect(api.getCommodities.mock.calls[0][2]).toEqual({ limit: 60 })
    expect(results.map((r) => r.item.key)).toEqual([1, 2])
    expect(truncated).toBe(false)
  })

  it('returns the server starter list for an empty query', async () => {
    api.getCommodities.mockResolvedValue([row(9, '14111507', 'Printer or copier paper')])
    const res = await searchCommodities('')
    expect(res.suggestions).toBe(true)
    expect(api.getCommodities).toHaveBeenCalledWith('', expect.anything())
  })

  it('does not call the server for a query made only of sizes', async () => {
    const res = await searchCommodities('500 ML')
    expect(res.results).toEqual([])
    expect(api.getCommodities).not.toHaveBeenCalled()
  })

  it('reports truncation when a word hits the candidate cap', async () => {
    api.getCommodities.mockResolvedValue(Array.from({ length: 60 }, (_, i) => row(i + 1, `4213${String(i).padStart(4, '0')}`, `Glove ${i}`)))
    const res = await searchCommodities('gloves')
    expect(res.truncated).toBe(true)
  })
})
