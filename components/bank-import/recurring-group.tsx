'use client'

import { RecurringGroup } from '@/lib/bank-import/types'

interface RecurringGroupCardProps {
  group: RecurringGroup
  selected: boolean
  onToggle: () => void
}

export function RecurringGroupCard({ group, selected, onToggle }: RecurringGroupCardProps) {
  const formatCycle = (cycle: string) => {
    switch (cycle) {
      case 'weekly': return '/wk'
      case 'monthly': return '/mo'
      case 'yearly': return '/yr'
      default: return ''
    }
  }

  return (
    <div
      onClick={onToggle}
      className={`
        p-4 border rounded-lg cursor-pointer transition-colors
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-5 h-5 rounded"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1">
          <div className="font-medium">
            {group.serviceName || group.merchantName}
          </div>
          <div className="text-sm text-gray-500">
            {group.transactions.length} charges found
          </div>
        </div>

        <div className="text-right">
          <div className="font-medium">
            ${group.amount.toFixed(2)}{formatCycle(group.billingCycle)}
          </div>
          <div className="text-xs text-gray-400">
            {Math.round(group.confidence * 100)}% confidence
          </div>
        </div>
      </div>
    </div>
  )
}
