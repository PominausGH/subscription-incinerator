import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GmailConnectionCard } from '@/components/settings/gmail-connection-card'
import { CurrencySettings } from '@/components/settings/currency-settings'
import { NotificationSettings } from '@/components/settings/notification-settings'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailProvider: true,
      oauthTokens: true,
      homeCurrency: true,
    },
  })

  const isGmailConnected = user?.emailProvider === 'gmail' && user?.oauthTokens !== null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Email Scanning</h2>
          <p className="text-gray-800 mb-6">
            Connect your Gmail to automatically detect subscriptions from your emails.
          </p>

          <GmailConnectionCard
            isConnected={isGmailConnected}
            userEmail={user?.email || ''}
            userTier={session.user.tier}
          />
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Currency</h2>
          <p className="text-gray-800 mb-6">
            Set your home currency. All subscription costs will be converted for spending reports.
          </p>
          <CurrencySettings currentCurrency={user?.homeCurrency || 'USD'} />
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Reminders</h2>
          <p className="text-gray-800 mb-6">
            Configure how and when you receive reminders for upcoming renewals and trial endings.
          </p>
          <NotificationSettings />
        </section>
      </div>
    </div>
  )
}
