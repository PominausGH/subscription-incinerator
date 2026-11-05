import { db } from '@/lib/db/client'
import { emailService } from '@/lib/services/email'
import { NotificationPreferences } from '@/lib/notifications/types'

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export async function processQuarterlyAudit() {
  // The unsubscribe link is signed with NEXTAUTH_SECRET. Never send without a working one.
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn('Quarterly audit skipped: NEXTAUTH_SECRET is not set in the worker environment')
    return { checked: 0, sent: 0, skipped: 'missing-secret' as const }
  }

  const cutoff = new Date(Date.now() - NINETY_DAYS_MS)

  const dueUsers = await db.user.findMany({
    where: {
      emailVerified: { not: null }, // never mail an address nobody has confirmed
      OR: [
        { lastQuarterlyAuditEmailAt: null, createdAt: { lte: cutoff } },
        { lastQuarterlyAuditEmailAt: { lte: cutoff } },
      ],
    },
    select: { id: true, email: true, name: true, notificationPreferences: true },
  })

  let sent = 0

  for (const user of dueUsers) {
    const prefs = user.notificationPreferences as unknown as NotificationPreferences
    if (prefs?.channels?.email === false) continue

    const unsubscribed = await db.emailUnsubscribe.findUnique({ where: { email: user.email.trim().toLowerCase() } })
    if (unsubscribed) continue

    const ok = await emailService.scheduleQuarterlyAudit(user.email, user.name ?? 'there')
    if (ok) {
      await db.user.update({
        where: { id: user.id },
        data: { lastQuarterlyAuditEmailAt: new Date() },
      })
      sent++
    }
  }

  console.log(`Quarterly audit check: ${sent}/${dueUsers.length} emails sent`)

  return { checked: dueUsers.length, sent }
}
