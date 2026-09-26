import { alternativeCategories } from './alternatives'

export function formatStars(stars: number): string {
  if (stars >= 1000) return `${(stars / 1000).toFixed(stars >= 10000 ? 0 : 1)}k`
  return stars.toString()
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Service -> tools that replace it, built from each tool's `replaces` list, sorted A-Z. */
export function buildServiceIndex(): [string, { name: string; slug: string }[]][] {
  const index = new Map<string, { name: string; slug: string }[]>()
  for (const cat of alternativeCategories) {
    for (const alt of cat.alternatives) {
      for (const service of alt.replaces ?? []) {
        const list = index.get(service) ?? []
        list.push({ name: alt.name, slug: slugify(alt.name) })
        index.set(service, list)
      }
    }
  }
  return Array.from(index.entries()).sort((a, b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }))
}
