import { getCurrentUser } from '@/lib/session'
import { Navbar } from '@/components/dashboard/navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email!} userTier={user.tier} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
