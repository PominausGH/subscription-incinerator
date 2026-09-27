/**
 * @jest-environment node
 */
import { toAlternativeRows } from '@/lib/open-source/db-rows'
import { alternativeCategories } from '@/lib/open-source/alternatives'

describe('toAlternativeRows', () => {
  const rows = toAlternativeRows()

  it('produces unique (service, alternative) pairs, matching the table unique key', () => {
    const keys = rows.map(r => `${r.serviceName}\u0000${r.alternativeName}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('emits one row per replaced service for every tool that has a replaces list', () => {
    const expected = alternativeCategories
      .flatMap(c => c.alternatives)
      .reduce((n, a) => n + (a.replaces?.length ?? 0), 0)
    expect(rows).toHaveLength(expected)
    expect(rows.length).toBeGreaterThan(100)
  })

  it('carries the fields the table needs', () => {
    for (const r of rows) {
      expect(r.serviceName).toBeTruthy()
      expect(r.alternativeName).toBeTruthy()
      expect(r.description.length).toBeGreaterThan(10)
      expect(r.websiteUrl).toMatch(/^https:\/\//)
      expect(r.sourceCodeUrl).toMatch(/^https:\/\//)
      expect(r.license).toBeTruthy()
      expect(r.category).toBeTruthy()
      expect(r.stars).toBeGreaterThanOrEqual(0)
    }
  })

  it('reflects the corrected list, not the old hand-copied seed', () => {
    const names = new Set(rows.map(r => r.alternativeName))
    expect(names.has('LibreLingo')).toBe(false) // archived upstream
    expect(names.has('n8n')).toBe(true)
    const openWebUi = rows.find(r => r.alternativeName === 'Open WebUI')
    expect(openWebUi?.license).toBe('Open WebUI License') // not the old "MIT"
    expect(rows.some(r => r.serviceName === 'Max')).toBe(false) // renamed HBO Max
    expect(rows.some(r => r.serviceName === 'HBO Max')).toBe(true)
  })
})
