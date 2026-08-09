import { redirect } from 'next/navigation'
import { auth, isPremium } from '@/lib/auth'
import { BackButton } from '@/components/ui/back-button'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { ImportClient } from '@/components/bank-import/import-client'

export default async function ImportPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/import')
  }

  const premium = isPremium(session.user)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <BackButton />
        <h1 className="text-2xl font-bold mb-2">Import Bank Statement</h1>
        <p className="text-gray-600 mb-8">
          Upload your bank statement CSV to automatically detect subscriptions.
          We&apos;ll analyze your transactions and find recurring charges.
        </p>

        {premium ? (
          <>
            <ImportClient />
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">How to export your bank statement:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Log in to your bank&apos;s website or app</li>
                <li>Navigate to your account transactions</li>
                <li>Look for &quot;Download&quot; or &quot;Export&quot; option</li>
                <li>Select CSV format (not PDF)</li>
                <li>Choose date range (3+ months recommended)</li>
              </ol>
            </div>
          </>
        ) : (
          <UpgradePrompt
            feature="Bank statement import"
            description="Upload a CSV from your bank and we'll surface every recurring charge hiding in there. Available on Premium."
          />
        )}
      </div>
    </div>
  )
}
