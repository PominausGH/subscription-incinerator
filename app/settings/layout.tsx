import { Navigation } from '@/components/navigation'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation user={session.user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">{children}</div>
      </main>
    </div>
  )
}
