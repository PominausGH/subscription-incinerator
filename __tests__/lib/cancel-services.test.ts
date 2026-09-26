/**
 * @jest-environment node
 */
import { cancellationServices } from '@/lib/cancel/services'
import { findAlternativesForService } from '@/lib/open-source/alternatives'

describe('cancellationServices', () => {
  it('has unique, URL-safe slugs and names', () => {
    const slugs = cancellationServices.map(s => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    const names = cancellationServices.map(s => s.name.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
  })

  it.each(cancellationServices.map(s => [s.slug, s] as const))('%s has a complete guide', (_slug, s) => {
    expect(s.steps.length).toBeGreaterThanOrEqual(3)
    expect(s.warnings.length).toBeGreaterThanOrEqual(1)
    expect(['Easy', 'Medium', 'Hard']).toContain(s.difficulty)
    expect(s.difficultyReason.length).toBeGreaterThan(10)
    if (s.directCancelUrl) expect(s.directCancelUrl).toMatch(/^https:\/\//)
    // prices are all-or-nothing on the annual figure: never show an annual cost without a monthly one
    if (s.annualCost) expect(s.monthlyPrice).toBeTruthy()
  })
})

describe('cancel guides <-> open-source directory', () => {
  it.each([
    ['Netflix', 'Jellyfin'],
    ['HBO Max', 'Jellyfin'],
    ['Dropbox', 'Nextcloud'],
    ['Microsoft 365', 'LibreOffice'],
    ['1Password', 'Vaultwarden'],
    ['Grammarly', 'LanguageTool'],
    ['Notion', 'AppFlowy'],
  ])('%s guide surfaces %s as a free alternative', (service, tool) => {
    expect(cancellationServices.some(s => s.name === service)).toBe(true)
    const cat = findAlternativesForService(service)
    expect(cat?.alternatives.map(a => a.name)).toContain(tool)
  })
})
