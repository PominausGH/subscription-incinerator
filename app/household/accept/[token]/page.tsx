import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { AcceptInviteForm } from '@/components/household/accept-invite-form'

type Props = {
  params: Promise<{ token: string }>
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Invite unavailable</h1>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </main>
  )
}

export default async function AcceptInvitePage({ params }: Props) {
  const { token } = await params
  const invite = await db.householdInvite.findUnique({ where: { token } })

  if (!invite) {
    return <ErrorState message="This invite link is invalid." />
  }
  if (invite.status !== 'pending') {
    return <ErrorState message="This invite has already been used or revoked." />
  }
  if (invite.expiresAt < new Date()) {
    return <ErrorState message="This invite has expired. Ask for a new one." />
  }

  const [owner, session, existingAccount] = await Promise.all([
    db.user.findUnique({ where: { id: invite.ownerId }, select: { email: true } }),
    auth(),
    db.user.findUnique({ where: { email: invite.email }, select: { id: true } }),
  ])

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Household invite</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        <strong>{owner?.email ?? 'Someone'}</strong> invited <strong>{invite.email}</strong> to join
        their household on Subscription Incinerator.
      </p>
      <AcceptInviteForm
        token={token}
        inviteEmail={invite.email}
        accountExists={!!existingAccount}
        sessionEmail={session?.user?.email ?? null}
      />
    </main>
  )
}
