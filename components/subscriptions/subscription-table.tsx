'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EditSubscriptionModal } from './edit-subscription-modal'
import { getCategoryIcon } from '@/lib/categories/presets'
import { getCurrencySymbol } from '@/lib/currency/exchange-rates'

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

function TableRow({ subscription }: { subscription: Subscription }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete subscription')
      router.refresh()
    } catch {
      alert('Failed to delete subscription. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const isCancelled = subscription.status === 'cancelled'

  return (
    <>
      <tr className={`border-b border-gray-100 hover:bg-gray-50 ${isCancelled ? 'opacity-50' : ''}`}>
        <td className="py-3 px-4 text-sm font-medium text-gray-900">
          {subscription.serviceName}
        </td>
        <td className="py-3 px-4">
          <span className={`px-2 py-0.5 text-xs rounded font-medium ${
            subscription.type === 'BUSINESS'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {subscription.type === 'BUSINESS' ? 'Business' : 'Personal'}
          </span>
        </td>
        <td className="py-3 px-4">
          {subscription.category ? (
            <span className="px-2 py-0.5 text-xs rounded font-medium bg-blue-50 text-blue-700">
              {getCategoryIcon(subscription.category.name)} {subscription.category.name}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>
        <td className="py-3 px-4 text-sm text-gray-900">
          {subscription.amount != null
            ? `${getCurrencySymbol(subscription.currency)}${subscription.amount.toFixed(2)}${subscription.billingCycle ? `/${subscription.billingCycle}` : ''}`
            : <span className="text-gray-400">—</span>
          }
        </td>
        <td className="py-3 px-4">
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
            subscription.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
            subscription.status === 'active' ? 'bg-green-100 text-green-800' :
            subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {subscription.status}
          </span>
        </td>
        <td className="py-3 px-4 text-sm text-gray-700">
          {subscription.nextBillingDate
            ? new Date(subscription.nextBillingDate).toLocaleDateString()
            : <span className="text-gray-400">—</span>
          }
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            {!showConfirm ? (
              <Button variant="destructive" size="sm" onClick={() => setShowConfirm(true)}>
                Delete
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? '...' : 'Yes'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
                  No
                </Button>
              </div>
            )}
          </div>
        </td>
      </tr>
      <EditSubscriptionModal
        subscription={subscription}
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
      />
    </>
  )
}

export function SubscriptionTable({ subscriptions }: { subscriptions: Subscription[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Next Billing</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <TableRow key={sub.id} subscription={sub} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
