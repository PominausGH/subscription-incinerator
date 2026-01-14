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
      if (sub.billingCycle === 'yearly') {
        return total + sub.amount / 12
      }
      return total + sub.amount
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
      if (sub.billingCycle === 'yearly') {
        return total + sub.amount
      }
      return total + sub.amount * 12
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
    const maxMonthly = max.billingCycle === 'yearly' ? (max.amount || 0) / 12 : (max.amount || 0)
    const subMonthly = sub.billingCycle === 'yearly' ? (sub.amount || 0) / 12 : (sub.amount || 0)
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
