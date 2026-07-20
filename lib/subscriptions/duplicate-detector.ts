import { toMonthlyAmount } from '@/lib/analytics/queries'

export type SubscriptionForOverlap = {
  id: string
  serviceName: string
  amount: number | null
  currency: string
  billingCycle: string | null
  status: string
  categoryName: string | null
}

export type OverlapGroup = {
  categoryName: string
  subscriptions: SubscriptionForOverlap[]
  monthlyByCurrency: Record<string, number>
}

// Uncategorized subscriptions aren't comparable to each other, so they're
// excluded rather than lumped into a noisy "Other" overlap group.
export function findOverlappingSubscriptions(
  subscriptions: SubscriptionForOverlap[]
): OverlapGroup[] {
  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial'
  )

  const byCategory = new Map<string, SubscriptionForOverlap[]>()
  for (const sub of active) {
    if (!sub.categoryName) continue
    const group = byCategory.get(sub.categoryName) ?? []
    group.push(sub)
    byCategory.set(sub.categoryName, group)
  }

  const groups: OverlapGroup[] = []
  for (const [categoryName, subs] of Array.from(byCategory.entries())) {
    if (subs.length < 2) continue

    const monthlyByCurrency: Record<string, number> = {}
    for (const sub of subs) {
      if (!sub.amount) continue
      const monthly = toMonthlyAmount(sub.amount, sub.billingCycle)
      monthlyByCurrency[sub.currency] = Math.round(((monthlyByCurrency[sub.currency] ?? 0) + monthly) * 100) / 100
    }

    groups.push({ categoryName, subscriptions: subs, monthlyByCurrency })
  }

  return groups.sort((a, b) => b.subscriptions.length - a.subscriptions.length)
}
