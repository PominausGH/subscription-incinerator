import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { OpenSourcePageClient } from '@/components/open-source/open-source-page-client'

export const metadata = {
  title: 'Open Source Alternatives — Subscription Incinerator',
  description: 'Save money by switching to free open source tools',
}

export default async function OpenSourcePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [allAlternatives, activeSubs] = await Promise.all([
    db.openSourceAlternative.findMany({
      orderBy: [{ category: 'asc' }, { stars: 'desc' }],
    }),
    db.subscription.findMany({
      where: { userId: user.id, status: { in: ['active', 'trial'] } },
      select: { serviceName: true },
    }),
  ])
  const userServiceNames = new Set(
    activeSubs.map(s => s.serviceName.toLowerCase())
  )

  // Group by category, deduplicating by alternativeName within each category
  // (DB stores one row per serviceName+alternativeName pair, so Jellyfin appears
  //  9 times for Netflix/Disney+/etc — we only want to show it once per category)
  const grouped: Record<string, typeof allAlternatives> = {}
  for (const alt of allAlternatives) {
    const cat = alt.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    const alreadyShown = grouped[cat].some(a => a.alternativeName === alt.alternativeName)
    if (!alreadyShown) grouped[cat].push(alt)
  }

  // Find which service names from the alternatives DB match the user's subscriptions
  const matchedServiceNames = new Set(
    allAlternatives
      .filter(alt => userServiceNames.has(alt.serviceName.toLowerCase()))
      .map(alt => alt.serviceName)
  )

  return (
    <OpenSourcePageClient
      grouped={grouped}
      matchedServiceNames={Array.from(matchedServiceNames)}
    />
  )
}
