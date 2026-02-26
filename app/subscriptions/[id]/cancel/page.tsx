import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { db } from '@/lib/db/client'
import { CancellationWizard } from '@/components/subscriptions/cancellation-wizard'
import { OpenSourceAlternatives } from '@/components/subscriptions/open-source-alternatives'

interface CancelPageProps {
  params: {
    id: string
  }
}

export default async function CancelPage({ params }: CancelPageProps) {
  const user = await getCurrentUser()

  // Explicit check for clarity (getCurrentUser redirects if not authenticated)
  if (!user) {
    redirect('/login')
  }

  const subscription = await db.subscription.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
      serviceName: true,
      status: true,
      amount: true,
      currency: true,
      billingCycle: true,
    },
  })

  if (!subscription) {
    notFound()
  }

  // Check ownership
  if (subscription.userId !== user.id) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cancel Subscription</h1>
        <p className="text-gray-600">
          {subscription.serviceName} - {subscription.amount ? `${subscription.currency} ${subscription.amount}` : 'Amount not set'} / {subscription.billingCycle || 'monthly'}
        </p>
      </div>

      <CancellationWizard subscriptionId={subscription.id} />

      <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-emerald-800 font-semibold mb-2">Consider these free alternatives before you cancel</p>
        <OpenSourceAlternatives subscriptionId={subscription.id} />
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-semibold mb-2">Important Notes:</p>
        <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
          <li>Canceling here provides instructions only - you must cancel on the service website</li>
          <li>Most services allow access until the end of your billing period</li>
          <li>Save any confirmation numbers or emails you receive</li>
          <li>If you have trouble canceling, contact the service support team</li>
        </ul>
      </div>
    </div>
  )
}
