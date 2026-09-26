import {
  alternativeCategories,
  alternativeGroups,
  dataVerifiedAt,
  totalAlternatives,
} from '@/lib/open-source/alternatives'
import { buildServiceIndex, formatStars } from '@/lib/open-source/helpers'

const BASE_URL = 'https://subscriptionincinerator.app'

export const dynamic = 'force-static'

/**
 * Plain-markdown export of the open-source alternatives list, generated from the
 * same data as /open-source so the two can't drift. Linked from /llms.txt.
 */
export function GET() {
  const lines: string[] = []

  lines.push('# Open Source Alternatives to Paid Subscriptions')
  lines.push('')
  lines.push(
    `> ${totalAlternatives} open-source and source-available tools across ${alternativeCategories.length} categories, each mapped to the paid subscriptions it can replace. Maintained by Subscription Incinerator (${BASE_URL}). Licenses, GitHub stars, and repository status last checked ${dataVerifiedAt}; projects hosted outside GitHub keep previously recorded figures.`
  )
  lines.push('')
  lines.push(`Human-readable version: ${BASE_URL}/open-source`)
  lines.push('')
  lines.push('## Caveats')
  lines.push('')
  lines.push('- These tools replace the software, not the content. Jellyfin, Navidrome, and Audiobookshelf play media you supply; they do not include a Netflix, Spotify, or Audible catalogue.')
  lines.push('- Self-hosting costs time and usually a server (from about $5/month for a small VPS, or your own hardware).')
  lines.push('- "Open core" tools keep most code open but reserve some features under a separate commercial license; "source-available" licenses (e.g. BSL-1.1) restrict some uses. Any such carve-out is listed as a license note on the tool.')
  lines.push('')

  lines.push('## Find the alternative to a subscription')
  lines.push('')
  for (const [service, tools] of buildServiceIndex()) {
    lines.push(`- ${service}: ${tools.map(t => t.name).join(', ')}`)
  }
  lines.push('')

  for (const group of alternativeGroups) {
    lines.push(`# ${group.label}`)
    lines.push('')
    for (const cat of alternativeCategories.filter(c => c.group === group.key)) {
      lines.push(`## ${cat.category}`)
      lines.push('')
      lines.push(`Replaces: ${cat.paidServices.join(', ')}`)
      if (cat.note) {
        lines.push('')
        lines.push(`Note: ${cat.note}`)
      }
      lines.push('')
      for (const alt of cat.alternatives) {
        lines.push(`### ${alt.name}`)
        lines.push('')
        lines.push(alt.description)
        lines.push('')
        if (alt.replaces && alt.replaces.length > 0) {
          lines.push(`- Alternative to: ${alt.replaces.join(', ')}`)
        }
        lines.push(`- License: ${alt.license}`)
        if (alt.licenseNote) lines.push(`- License note: ${alt.licenseNote}`)
        if (alt.stars > 0) lines.push(`- GitHub stars: ~${formatStars(alt.stars)}`)
        lines.push(`- Self-hostable: ${alt.selfHosted ? 'yes' : 'no (desktop or client app)'}`)
        lines.push(`- Website: ${alt.websiteUrl}`)
        lines.push(`- Source code: ${alt.sourceCodeUrl}`)
        if (alt.installInstructions) lines.push(`- Install: ${alt.installInstructions}`)
        lines.push('')
      }
    }
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
