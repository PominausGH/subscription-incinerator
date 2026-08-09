import { filterRecurringTransactions } from '@/lib/plaid/sync'

type Transaction = { merchantName: string | null; amount: number; date: string }

describe('filterRecurringTransactions', () => {
  it('returns merchants that appear 2 or more times', () => {
    const transactions: Transaction[] = [
      { merchantName: 'NETFLIX', amount: 15.99, date: '2026-01-01' },
      { merchantName: 'NETFLIX', amount: 15.99, date: '2026-02-01' },
      { merchantName: 'STARBUCKS', amount: 5.50, date: '2026-01-15' },
    ]
    const recurring = filterRecurringTransactions(transactions)
    expect(recurring.map((t) => t.merchantName)).toContain('NETFLIX')
    expect(recurring.map((t) => t.merchantName)).not.toContain('STARBUCKS')
  })

  it('excludes transactions with null merchantName', () => {
    const transactions: Transaction[] = [
      { merchantName: null, amount: 10, date: '2026-01-01' },
      { merchantName: null, amount: 10, date: '2026-02-01' },
    ]
    const recurring = filterRecurringTransactions(transactions)
    expect(recurring).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(filterRecurringTransactions([])).toEqual([])
  })
})
