import { db } from '@/lib/db/client'
import { emailService } from '@/lib/services/email'
import { connection } from '@/lib/queue/client'

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_AGE_DAYS = 2 // give people a chance to add one themselves first
const MAX_AGE_DAYS = 14 // don't chase old signups
const SENT_KEY_TTL_SECONDS = 60 * 24 * 60 * 60

const sentKey = (userId: string) => `activation-nudge:sent:${userId}`

/**
 * One-off nudge to signups who created an account 2-14 days ago and still have no
 * subscriptions. Sent at most once per user (Redis SET NX, so no schema change),
 * never to unsubscribed emails or users who turned email notifications off.
 */
export async function processActivationNudge() {
  // The unsubscribe link is signed with NEXTAUTH_SECRET. Never send a nudge without a working one.
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn('Activation nudge skipped: NEXTAUTH_SECRET is not set in the worker environment')
    return { checked: 0, sent: 0, skipped: 'missing-secret' as const }
  }

  const now = Date.now()
  const candidates = await db.user.findMany({
    where: {
      createdAt: {
        gte: new Date(now - MAX_AGE_DAYS * DAY_MS),
        lte: new Date(now - MIN_AGE_DAYS * DAY_MS),
      },
      subscriptions: { none: {} },
    },
    select: { id: true, email: true, name: true, notificationPreferences: true },
  })

  let sent = 0

  for (const user of candidates) {
    const prefs = user.notificationPreferences as { email?: boolean; channels?: { email?: boolean } } | null
    if (prefs?.email === false || prefs?.channels?.email === false) continue

    const email = user.email.trim().toLowerCase()
    const unsubscribed = await db.emailUnsubscribe.findUnique({ where: { email } })
    if (unsubscribed) continue

    // Claim the send first so concurrent runs can't double-email; release it if delivery fails.
    const claimed = await connection.set(sentKey(user.id), '1', 'EX', SENT_KEY_TTL_SECONDS, 'NX')
    if (claimed !== 'OK') continue

    const ok = await emailService.sendActivationNudge(email, user.name ?? 'there')
    if (ok) {
      sent++
    } else {
      await connection.del(sentKey(user.id))
    }
  }

  console.log(`Activation nudge: ${sent}/${candidates.length} emails sent`)
  return { checked: candidates.length, sent }
}
