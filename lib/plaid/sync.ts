import { encrypt, decrypt } from '@/lib/crypto'

export type PlaidTransaction = {
  merchantName: string | null
  amount: number
  date: string
}

export function filterRecurringTransactions(
  transactions: PlaidTransaction[]
): PlaidTransaction[] {
  const counts = new Map<string, number>()
  for (const t of transactions) {
    if (!t.merchantName) continue
    counts.set(t.merchantName, (counts.get(t.merchantName) ?? 0) + 1)
  }
  return transactions.filter(
    (t) => t.merchantName !== null && (counts.get(t.merchantName!) ?? 0) >= 2
  )
}

export function encryptAccessToken(token: string): string {
  return encrypt(token)
}

export function decryptAccessToken(encrypted: string): string {
  return decrypt(encrypted)
}
