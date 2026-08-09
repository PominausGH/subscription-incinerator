export function toMonthlyAmount(amount: number, billingCycle: string | null): number {
  switch (billingCycle) {
    case 'weekly':      return amount * 4.33
    case 'fortnightly': return amount * 2.17
    case 'bimonthly':   return amount / 2
    case 'quarterly':   return amount / 3
    case 'semi-annual': return amount / 6
    case 'yearly':      return amount / 12
    default:            return amount // monthly or custom
  }
}

export type SubscriptionForCalc = {
  amount: number | null
  billingCycle: string | null
  status: string
  type?: 'PERSONAL' | 'BUSINESS'
}

export function calculateMonthlyTotal<T extends SubscriptionForCalc>(
  subscriptions: T[],
  typeFilter?: 'PERSONAL' | 'BUSINESS'
): number {
  return subscriptions
    .filter((sub) => sub.status === 'active' || sub.status === 'trial')
    .filter((sub) => !typeFilter || sub.type === typeFilter)
    .reduce((total, sub) => {
      if (!sub.amount) return total
      return total + toMonthlyAmount(sub.amount, sub.billingCycle)
    }, 0)
}

export function calculateYearlyTotal<T extends SubscriptionForCalc>(
  subscriptions: T[],
  typeFilter?: 'PERSONAL' | 'BUSINESS'
): number {
  return subscriptions
    .filter((sub) => sub.status === 'active' || sub.status === 'trial')
    .filter((sub) => !typeFilter || sub.type === typeFilter)
    .reduce((total, sub) => {
      if (!sub.amount) return total
      return total + toMonthlyAmount(sub.amount, sub.billingCycle) * 12
    }, 0)
}

export function getTopSpender<T extends SubscriptionForCalc>(
  subscriptions: T[]
): T | null {
  const active = subscriptions.filter(
    (sub) => (sub.status === 'active' || sub.status === 'trial') && sub.amount
  )
  if (active.length === 0) return null

  return active.reduce((max, sub) => {
    const maxMonthly = toMonthlyAmount(max.amount || 0, max.billingCycle)
    const subMonthly = toMonthlyAmount(sub.amount || 0, sub.billingCycle)
    return subMonthly > maxMonthly ? sub : max
  })
}

export function countByType<T extends SubscriptionForCalc>(
  subscriptions: T[]
): { personal: number; business: number } {
  const active = subscriptions.filter(
    (sub) => sub.status === 'active' || sub.status === 'trial'
  )
  return {
    personal: active.filter((sub) => sub.type === 'PERSONAL' || !sub.type).length,
    business: active.filter((sub) => sub.type === 'BUSINESS').length,
  }
}

export type SubscriptionForCategoryCalc = SubscriptionForCalc & {
  categoryName: string | null
}

export function calculateByCategory(
  subscriptions: SubscriptionForCategoryCalc[]
): { name: string; monthly: number; yearly: number }[] {
  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial'
  )

  const map = new Map<string, number>()
  for (const sub of active) {
    if (!sub.amount) continue
    const key = sub.categoryName ?? 'Uncategorised'
    const current = map.get(key) ?? 0
    map.set(key, current + toMonthlyAmount(sub.amount, sub.billingCycle))
  }

  return Array.from(map.entries())
    .map(([name, monthly]) => ({
      name,
      monthly: Math.round(monthly * 100) / 100,
      yearly:  Math.round(monthly * 12 * 100) / 100,
    }))
    .sort((a, b) => b.monthly - a.monthly)
}
