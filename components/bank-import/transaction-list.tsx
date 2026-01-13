'use client'

import { useState } from 'react'
import { Transaction } from '@/lib/bank-import/types'

interface TransactionListProps {
  transactions: Transaction[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  recurringIds: Set<string>
}

export function TransactionList({
  transactions,
  selectedIds,
  onToggle,
  recurringIds
}: TransactionListProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'debits' | 'credits'>('debits')

  const filtered = transactions.filter(txn => {
    const matchesSearch = txn.description.toLowerCase().includes(search.toLowerCase()) ||
      (txn.serviceName?.toLowerCase().includes(search.toLowerCase()))

    const matchesFilter = filter === 'all' ||
      (filter === 'debits' && txn.amount < 0) ||
      (filter === 'credits' && txn.amount > 0)

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="debits">Debits only</option>
          <option value="credits">Credits only</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
        {filtered.map((txn) => (
          <div
            key={txn.id}
            onClick={() => onToggle(txn.id)}
            className={`
              p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50
              ${selectedIds.has(txn.id) ? 'bg-blue-50' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(txn.id)}
              onChange={() => onToggle(txn.id)}
              className="w-4 h-4 rounded"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {txn.serviceName || txn.description}
                </span>
                {recurringIds.has(txn.id) && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    recurring
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {txn.date} • {txn.description}
              </div>
            </div>

            <div className={`font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {txn.amount < 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No transactions found
          </div>
        )}
      </div>
    </div>
  )
}
