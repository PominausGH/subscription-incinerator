import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { OpenSourcePageClient } from '@/components/open-source/open-source-page-client'

export const metadata = {
  title: 'Open Source Alternatives — Subscription Incinerator',
  description: 'Save money by switching to free open source tools',
}

export default async function OpenSourcePage() {
  const user = await getCurrentUser()

  // Fetch all alternatives grouped by category
  const allAlternatives = await db.openSourceAlternative.findMany({
    orderBy: [{ category: 'asc' }, { stars: 'desc' }],
  })

  // Get user's active subscription service names for matching
  const activeSubs = await db.subscription.findMany({
    where: { userId: user.id, status: { in: ['active', 'trial'] } },
    select: { serviceName: true },
  })
  const userServiceNames = new Set(
    activeSubs.map(s => s.serviceName.toLowerCase())
  )

  // Group by category
  const grouped: Record<string, typeof allAlternatives> = {}
  for (const alt of allAlternatives) {
    const cat = alt.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(alt)
  }

  // Find which service names from the alternatives DB match the user's subscriptions
  const matchedServiceNames = new Set<string>()
  for (const alt of allAlternatives) {
    if (userServiceNames.has(alt.serviceName.toLowerCase())) {
      matchedServiceNames.add(alt.serviceName)
    }
  }

  return (
    <OpenSourcePageClient
      grouped={grouped}
      matchedServiceNames={Array.from(matchedServiceNames)}
    />
  )
}
