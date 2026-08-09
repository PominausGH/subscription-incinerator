'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecurringGroupCard } from '@/components/bank-import/recurring-group'
import { TransactionList } from '@/components/bank-import/transaction-list'
import { ProcessingResult, Transaction } from '@/lib/bank-import/types'

interface ImportData extends ProcessingResult {
  fileName: string
}

export default function ReviewPage() {
  const router = useRouter()
  const [data, setData] = useState<ImportData | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('bankImportResult')
    if (!stored) {
      router.push('/import')
      return
    }

    try {
      const parsed: ImportData = JSON.parse(stored)
      setData(parsed)

      // Pre-select all recurring groups
      const groupIds = new Set(parsed.recurringGroups.map((_, i) => `group-${i}`))
      setSelectedGroups(groupIds)
    } catch (e) {
      console.error('Failed to parse import data:', e)
      sessionStorage.removeItem('bankImportResult')
      router.push('/import')
    }
  }, [router])

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  const toggleGroup = (index: number) => {
    const id = `group-${index}`
    const next = new Set(selectedGroups)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedGroups(next)
  }

  const toggleTransaction = (id: string) => {
    const next = new Set(selectedTransactions)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedTransactions(next)
  }

  const selectAllGroups = () => {
    const allIds = new Set(data.recurringGroups.map((_, i) => `group-${i}`))
    setSelectedGroups(allIds)
  }

  const clearGroups = () => {
    setSelectedGroups(new Set())
  }

  // Get IDs of transactions that are part of recurring groups
  const recurringTransactionIds = new Set(
    data.recurringGroups.flatMap(g => g.transactions.map(t => t.id))
  )

  // Count total selected subscriptions
  const selectedGroupCount = selectedGroups.size
  const selectedTxnCount = Array.from(selectedTransactions).filter(
    id => !recurringTransactionIds.has(id)
  ).length
  const totalSelected = selectedGroupCount + selectedTxnCount

  const handleConfirm = async () => {
    setIsSubmitting(true)

    try {
      const selectedGroupData = data.recurringGroups.filter(
        (_, i) => selectedGroups.has(`group-${i}`)
      )

      const selectedTxnData = data.transactions.filter(
        t => selectedTransactions.has(t.id) && !recurringTransactionIds.has(t.id)
      )

      const response = await fetch('/api/bank-import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: data.fileName,
          selectedGroups: selectedGroupData,
          selectedTransactions: selectedTxnData,
          totalTransactions: data.stats.totalTransactions,
          recurringDetected: data.stats.recurringDetected
        })
      })

      if (!response.ok) {
        throw new Error('Failed to confirm import')
      }

      // Clear session storage and redirect
      sessionStorage.removeItem('bankImportResult')
      router.push('/dashboard?imported=true')
    } catch (error) {
      console.error('Confirm error:', error)
      alert('Failed to import subscriptions. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Review Import</h1>
          <p className="text-gray-600">
            {data.fileName} • {data.stats.totalTransactions} transactions found
          </p>
        </div>

        <button
          onClick={() => router.push('/import')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>

      {/* Recurring Groups */}
      {data.recurringGroups.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Detected Recurring Charges ({data.recurringGroups.length})
            </h2>
            <div className="space-x-2">
              <button
                onClick={selectAllGroups}
                className="text-sm text-blue-600 hover:underline"
              >
                Select All
              </button>
              <button
                onClick={clearGroups}
                className="text-sm text-gray-600 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {data.recurringGroups.map((group, index) => (
              <RecurringGroupCard
                key={index}
                group={group}
                selected={selectedGroups.has(`group-${index}`)}
                onToggle={() => toggleGroup(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Transactions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">All Transactions</h2>
        <TransactionList
          transactions={data.transactions}
          selectedIds={selectedTransactions}
          onToggle={toggleTransaction}
          recurringIds={recurringTransactionIds}
        />
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-gray-600">
            {totalSelected} subscription{totalSelected !== 1 ? 's' : ''} selected
          </div>

          <button
            onClick={handleConfirm}
            disabled={totalSelected === 0 || isSubmitting}
            className={`
              px-6 py-2 rounded-lg font-medium
              ${totalSelected > 0 && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'Importing...' : `Import ${totalSelected} Subscription${totalSelected !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Spacer for fixed footer */}
      <div className="h-20" />
    </div>
  )
}
