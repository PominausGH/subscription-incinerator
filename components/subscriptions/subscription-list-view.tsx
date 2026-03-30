'use client'

import { useState, useEffect } from 'react'
import { SubscriptionCard } from './subscription-card'
import { SubscriptionTable } from './subscription-table'
import { EmptySubscriptionsState } from './empty-state'

type Subscription = {
  id: string
  serviceName: string
  status: string
  billingCycle: string | null
  amount: number | null
  currency: string
  trialEndsAt: Date | null
  nextBillingDate: Date | null
  cancellationUrl: string | null
  type: 'PERSONAL' | 'BUSINESS'
  categoryId: string | null
  category?: { id: string; name: string } | null
  description: string | null
}

type ViewMode = 'grid' | 'table'

const STORAGE_KEY = 'subscription-view-mode'

function GridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function TableIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 6v12M3 6h18a0 0 0 010 0v12a0 0 0 010 0H3a0 0 0 010 0V6a0 0 0 010 0z" />
    </svg>
  )
}

export function SubscriptionListView({
  subscriptions,
  subscriptionTypeFilter,
}: {
  subscriptions: Subscription[]
  subscriptionTypeFilter?: React.ReactNode
}) {
  const [view, setView] = useState<ViewMode>('grid')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'table' || saved === 'grid') {
      setView(saved)
    }
  }, [])

  function switchView(mode: ViewMode) {
    setView(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  // Derive unique categories from the subscriptions list
  const categories = Array.from(
    new Map(
      subscriptions
        .filter((s) => s.category)
        .map((s) => [s.category!.id, s.category!])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const filtered = categoryFilter
    ? subscriptions.filter((s) => s.category?.id === categoryFilter)
    : subscriptions

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">
            Your Subscriptions ({filtered.length}{categoryFilter ? ` of ${subscriptions.length}` : ''})
          </h2>
          {subscriptionTypeFilter}
          {categories.length > 0 && (
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  categoryFilter === null
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
          <button
            onClick={() => switchView('grid')}
            title="Grid view"
            className={`p-2 ${view === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <GridIcon />
          </button>
          <button
            onClick={() => switchView('table')}
            title="Table view"
            className={`p-2 ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <TableIcon />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        subscriptions.length === 0 ? (
          <EmptySubscriptionsState />
        ) : (
          <p className="text-sm text-gray-500 py-8 text-center">No subscriptions match this filter.</p>
        )
      ) : view === 'table' ? (
        <SubscriptionTable subscriptions={filtered} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      )}
    </div>
  )
}
