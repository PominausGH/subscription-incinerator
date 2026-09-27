import { alternativeCategories } from './alternatives'

export type AlternativeRow = {
  serviceName: string
  alternativeName: string
  description: string
  websiteUrl: string
  sourceCodeUrl: string
  stars: number
  license: string
  category: string
}

/**
 * Flatten the public open-source list (lib/open-source/alternatives.ts) into one row per
 * (paid service, alternative) pair for the `open_source_alternatives` table, so the
 * dashboard and the public page are fed from a single source of truth.
 *
 * Tools with no `replaces` entry (e.g. Home Assistant) have no paid service to key on and are skipped.
 */
export function toAlternativeRows(): AlternativeRow[] {
  const rows: AlternativeRow[] = []
  for (const cat of alternativeCategories) {
    for (const alt of cat.alternatives) {
      for (const serviceName of alt.replaces ?? []) {
        rows.push({
          serviceName,
          alternativeName: alt.name,
          description: alt.description,
          websiteUrl: alt.websiteUrl,
          sourceCodeUrl: alt.sourceCodeUrl,
          stars: alt.stars,
          license: alt.license,
          category: cat.category,
        })
      }
    }
  }
  return rows
}
