import { Transaction, RecurringGroup } from './types'

type BillingCycle = 'weekly' | 'monthly' | 'yearly' | 'unknown'

interface PatternAnalysis {
  isRecurring: boolean
  typicalAmount: number
  cycle: BillingCycle
  confidence: number
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function detectCycle(intervals: number[]): BillingCycle {
  if (intervals.length === 0) return 'unknown'

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length

  if (avg >= 5 && avg <= 9) return 'weekly'
  if (avg >= 26 && avg <= 35) return 'monthly'
  if (avg >= 350 && avg <= 380) return 'yearly'
  return 'unknown'
}

export function analyzePattern(transactions: Transaction[]): PatternAnalysis {
  if (transactions.length < 2) {
    return { isRecurring: false, typicalAmount: 0, cycle: 'unknown', confidence: 0 }
  }

  // Sort by date
  const sorted = [...transactions].sort(
    (a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime()
  )

  // Check amount consistency
  const amounts = sorted.map(t => Math.abs(t.amount))
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const amountVariance = Math.max(...amounts) - Math.min(...amounts)
  const amountConsistent = amountVariance < avgAmount * 0.1 // <10% variance

  // Check interval consistency
  const intervals: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const days = daysBetween(sorted[i - 1].normalizedDate, sorted[i].normalizedDate)
    intervals.push(days)
  }

  const cycle = detectCycle(intervals)

  // Calculate confidence
  let confidence = 0.5
  if (amountConsistent) confidence += 0.2
  if (cycle !== 'unknown') confidence += 0.2
  if (transactions.length >= 3) confidence += 0.1

  return {
    isRecurring: confidence >= 0.6,
    typicalAmount: avgAmount,
    cycle,
    confidence
  }
}

function groupByMerchant(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {}

  for (const txn of transactions) {
    const key = txn.serviceName || txn.merchantName
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(txn)
  }

  return groups
}

export function detectRecurringCharges(transactions: Transaction[]): RecurringGroup[] {
  // Filter to debits only (negative amounts)
  const debits = transactions.filter(t => t.amount < 0)

  // Group transactions by merchant
  const groups = groupByMerchant(debits)

  const recurring: RecurringGroup[] = []

  for (const [merchant, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue // Need 2+ to detect pattern

    const analysis = analyzePattern(txns)

    if (analysis.isRecurring) {
      recurring.push({
        merchantName: txns[0].merchantName,
        serviceName: txns[0].serviceName,
        transactions: txns,
        amount: analysis.typicalAmount,
        billingCycle: analysis.cycle,
        confidence: analysis.confidence
      })
    }
  }

  return recurring.sort((a, b) => b.confidence - a.confidence)
}
