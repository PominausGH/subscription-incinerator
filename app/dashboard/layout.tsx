import { Navigation } from '@/components/navigation'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { VerifyEmailBanner } from '@/components/verify-email-banner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const account = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation user={session.user} />
      {account && !account.emailVerified && <VerifyEmailBanner email={account.email} />}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  )
}
