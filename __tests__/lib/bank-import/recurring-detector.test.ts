import { detectRecurringCharges, analyzePattern } from '@/lib/bank-import/recurring-detector'
import { Transaction } from '@/lib/bank-import/types'

const createTransaction = (
  date: string,
  description: string,
  amount: number,
  serviceName: string | null = null
): Transaction => ({
  id: Math.random().toString(),
  date,
  normalizedDate: new Date(date),
  description,
  amount,
  merchantName: description,
  serviceName,
  confidence: 0.9,
  matchSource: 'alias_db'
})

describe('detectRecurringCharges', () => {
  it('detects monthly recurring charges', () => {
    const transactions: Transaction[] = [
      createTransaction('2026-01-15', 'NETFLIX.COM', -15.99, 'Netflix'),
      createTransaction('2025-12-15', 'NETFLIX.COM', -15.99, 'Netflix'),
      createTransaction('2025-11-15', 'NETFLIX.COM', -15.99, 'Netflix'),
      createTransaction('2026-01-10', 'GROCERY STORE', -45.23),
    ]

    const result = detectRecurringCharges(transactions)

    expect(result).toHaveLength(1)
    expect(result[0].serviceName).toBe('Netflix')
    expect(result[0].billingCycle).toBe('monthly')
    expect(result[0].amount).toBeCloseTo(15.99)
  })

  it('requires 2+ transactions to detect recurring', () => {
    const transactions: Transaction[] = [
      createTransaction('2026-01-15', 'NETFLIX.COM', -15.99, 'Netflix'),
    ]

    const result = detectRecurringCharges(transactions)
    expect(result).toHaveLength(0)
  })

  it('detects yearly charges', () => {
    const transactions: Transaction[] = [
      createTransaction('2026-01-01', 'AMAZON PRIME', -139.00, 'Amazon Prime'),
      createTransaction('2025-01-01', 'AMAZON PRIME', -139.00, 'Amazon Prime'),
    ]

    const result = detectRecurringCharges(transactions)

    expect(result).toHaveLength(1)
    expect(result[0].billingCycle).toBe('yearly')
  })

  it('detects weekly recurring charges', () => {
    const transactions: Transaction[] = [
      createTransaction('2026-01-13', 'MEAL SUBSCRIPTION', -29.99, 'HelloFresh'),
      createTransaction('2026-01-06', 'MEAL SUBSCRIPTION', -29.99, 'HelloFresh'),
      createTransaction('2025-12-30', 'MEAL SUBSCRIPTION', -29.99, 'HelloFresh'),
      createTransaction('2025-12-23', 'MEAL SUBSCRIPTION', -29.99, 'HelloFresh'),
    ]

    const result = detectRecurringCharges(transactions)

    expect(result).toHaveLength(1)
    expect(result[0].serviceName).toBe('HelloFresh')
    expect(result[0].billingCycle).toBe('weekly')
    expect(result[0].amount).toBeCloseTo(29.99)
  })

  it('skips transactions without merchant or service name', () => {
    const transactions: Transaction[] = [
      { ...createTransaction('2026-01-15', '', -15.99), merchantName: '', serviceName: null },
      { ...createTransaction('2025-12-15', '', -15.99), merchantName: '', serviceName: null },
    ]

    const result = detectRecurringCharges(transactions)
    expect(result).toHaveLength(0)
  })
})

describe('analyzePattern', () => {
  it('calculates confidence based on amount consistency', () => {
    const consistent = [
      createTransaction('2026-01-15', 'TEST', -10.00),
      createTransaction('2025-12-15', 'TEST', -10.00),
    ]
    const inconsistent = [
      createTransaction('2026-01-15', 'TEST', -10.00),
      createTransaction('2025-12-15', 'TEST', -50.00),
    ]

    const consistentResult = analyzePattern(consistent)
    const inconsistentResult = analyzePattern(inconsistent)

    expect(consistentResult.confidence).toBeGreaterThan(inconsistentResult.confidence)
  })
})
