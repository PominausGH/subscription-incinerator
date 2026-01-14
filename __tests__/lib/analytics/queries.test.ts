import { calculateMonthlyTotal, calculateYearlyTotal } from '@/lib/analytics/queries'

describe('Analytics Queries', () => {
  describe('calculateMonthlyTotal', () => {
    it('should sum subscription amounts for the current month', () => {
      const subscriptions = [
        { amount: 9.99, billingCycle: 'monthly', status: 'active' },
        { amount: 14.99, billingCycle: 'monthly', status: 'active' },
        { amount: 120.00, billingCycle: 'yearly', status: 'active' },
      ]

      // Monthly subs count full amount, yearly divided by 12
      const result = calculateMonthlyTotal(subscriptions)
      expect(result).toBeCloseTo(9.99 + 14.99 + 10.00, 2) // 34.98
    })

    it('should exclude cancelled subscriptions', () => {
      const subscriptions = [
        { amount: 9.99, billingCycle: 'monthly', status: 'active' },
        { amount: 14.99, billingCycle: 'monthly', status: 'cancelled' },
      ]

      const result = calculateMonthlyTotal(subscriptions)
      expect(result).toBeCloseTo(9.99, 2)
    })
  })

  describe('calculateYearlyTotal', () => {
    it('should project annual cost from subscriptions', () => {
      const subscriptions = [
        { amount: 9.99, billingCycle: 'monthly', status: 'active' },
        { amount: 120.00, billingCycle: 'yearly', status: 'active' },
      ]

      // Monthly * 12 + yearly
      const result = calculateYearlyTotal(subscriptions)
      expect(result).toBeCloseTo(9.99 * 12 + 120.00, 2) // 239.88
    })
  })
})
