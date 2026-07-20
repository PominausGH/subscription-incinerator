import { findOverlappingSubscriptions } from '@/lib/subscriptions/duplicate-detector'

describe('findOverlappingSubscriptions', () => {
  it('flags categories with more than one active subscription', () => {
    const subs = [
      { id: '1', serviceName: 'Dropbox', amount: 9.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
      { id: '2', serviceName: 'Google One', amount: 1.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
      { id: '3', serviceName: 'Netflix', amount: 15.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Streaming' },
    ]

    const result = findOverlappingSubscriptions(subs)

    expect(result).toHaveLength(1)
    expect(result[0].categoryName).toBe('Cloud Storage')
    expect(result[0].subscriptions.map(s => s.serviceName)).toEqual(['Dropbox', 'Google One'])
  })

  it('sums monthly cost per currency within a group', () => {
    const subs = [
      { id: '1', serviceName: 'Dropbox', amount: 9.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
      { id: '2', serviceName: 'Google One', amount: 24, currency: 'USD', billingCycle: 'yearly', status: 'active', categoryName: 'Cloud Storage' },
      { id: '3', serviceName: 'iCloud+', amount: 2.99, currency: 'EUR', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
    ]

    const result = findOverlappingSubscriptions(subs)

    expect(result[0].monthlyByCurrency).toEqual({
      USD: 11.99, // 9.99 + 24/12
      EUR: 2.99,
    })
  })

  it('ignores categories with only one subscription', () => {
    const subs = [
      { id: '1', serviceName: 'Netflix', amount: 15.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Streaming' },
    ]

    expect(findOverlappingSubscriptions(subs)).toEqual([])
  })

  it('excludes uncategorized subscriptions from grouping', () => {
    const subs = [
      { id: '1', serviceName: 'Mystery Charge A', amount: 5, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: null },
      { id: '2', serviceName: 'Mystery Charge B', amount: 5, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: null },
    ]

    expect(findOverlappingSubscriptions(subs)).toEqual([])
  })

  it('excludes cancelled subscriptions', () => {
    const subs = [
      { id: '1', serviceName: 'Dropbox', amount: 9.99, currency: 'USD', billingCycle: 'monthly', status: 'cancelled', categoryName: 'Cloud Storage' },
      { id: '2', serviceName: 'Google One', amount: 1.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
    ]

    expect(findOverlappingSubscriptions(subs)).toEqual([])
  })

  it('includes trial subscriptions', () => {
    const subs = [
      { id: '1', serviceName: 'Dropbox', amount: 9.99, currency: 'USD', billingCycle: 'monthly', status: 'trial', categoryName: 'Cloud Storage' },
      { id: '2', serviceName: 'Google One', amount: 1.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
    ]

    expect(findOverlappingSubscriptions(subs)).toHaveLength(1)
  })

  it('sorts groups by number of overlapping subscriptions, descending', () => {
    const subs = [
      { id: '1', serviceName: 'Dropbox', amount: 9.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
      { id: '2', serviceName: 'Google One', amount: 1.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
      { id: '3', serviceName: 'iCloud+', amount: 2.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Cloud Storage' },
      { id: '4', serviceName: 'Netflix', amount: 15.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Streaming' },
      { id: '5', serviceName: 'Hulu', amount: 7.99, currency: 'USD', billingCycle: 'monthly', status: 'active', categoryName: 'Streaming' },
    ]

    const result = findOverlappingSubscriptions(subs)

    expect(result.map(g => g.categoryName)).toEqual(['Cloud Storage', 'Streaming'])
  })
})
