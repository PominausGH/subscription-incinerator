import { parseCSVWithAI } from './csv-parser'
import { matchMerchant } from './merchant-matcher'
import { detectRecurringCharges } from './recurring-detector'
import { Transaction, ProcessingResult, RawTransaction } from './types'
import { ERRORS } from './errors'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateFile(file: File): void {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw ERRORS.INVALID_FILE_TYPE
  }

  if (file.size > MAX_FILE_SIZE) {
    throw ERRORS.FILE_TOO_LARGE
  }
}

async function normalizeTransactions(raw: RawTransaction[]): Promise<Transaction[]> {
  const transactions: Transaction[] = []

  for (const txn of raw) {
    const match = await matchMerchant(txn.description)

    transactions.push({
      id: crypto.randomUUID(),
      date: txn.date,
      normalizedDate: new Date(txn.date),
      description: txn.description,
      amount: txn.amount,
      balance: txn.balance,
      merchantName: txn.description,
      serviceName: match.serviceName,
      confidence: match.confidence,
      matchSource: match.source
    })
  }

  return transactions
}

export async function processCSVContent(content: string): Promise<ProcessingResult> {
  // Parse CSV with AI
  const rawTransactions = await parseCSVWithAI(content)

  if (rawTransactions.length === 0) {
    throw ERRORS.NO_TRANSACTIONS
  }

  // Normalize merchants
  const transactions = await normalizeTransactions(rawTransactions)

  // Detect recurring patterns
  const recurringGroups = detectRecurringCharges(transactions)

  return {
    transactions,
    recurringGroups,
    stats: {
      totalTransactions: transactions.length,
      recurringDetected: recurringGroups.length
    }
  }
}

export async function processBankStatement(file: File): Promise<ProcessingResult> {
  // Validate file
  validateFile(file)

  // Read file content
  const content = await file.text()

  if (!content || content.trim().length === 0) {
    throw ERRORS.EMPTY_FILE
  }

  return processCSVContent(content)
}
