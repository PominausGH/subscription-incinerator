export interface RawTransaction {
  date: string
  description: string
  amount: number
  balance?: number
}

export interface Transaction extends RawTransaction {
  id: string
  normalizedDate: Date
  merchantName: string
  serviceName: string | null
  confidence: number
  matchSource: 'alias_db' | 'ai' | 'none'
}

export interface RecurringGroup {
  merchantName: string
  serviceName: string | null
  transactions: Transaction[]
  amount: number
  billingCycle: 'weekly' | 'monthly' | 'yearly' | 'unknown'
  confidence: number
}

export interface MerchantMatch {
  serviceName: string | null
  confidence: number
  source: 'alias_db' | 'ai' | 'none'
}

export interface ProcessingResult {
  transactions: Transaction[]
  recurringGroups: RecurringGroup[]
  stats: {
    totalTransactions: number
    recurringDetected: number
  }
}

export interface BankImportError {
  code: string
  message: string
  recoverable: boolean
}
