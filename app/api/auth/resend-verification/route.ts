import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { createVerificationToken } from '@/lib/email-verification'
import { sendVerificationEmail } from '@/lib/notifications/email'

export async function POST(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimit = await checkRateLimit(`resend-verification:${session.user.id}`, RATE_LIMITS.expensive)
  if (!rateLimit.success) return rateLimitResponse(rateLimit.reset)

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.emailVerified) return NextResponse.json({ message: 'Email already verified' })

  try {
    const token = await createVerificationToken(user.email)
    await sendVerificationEmail({ toEmail: user.email, token })
  } catch (error) {
    console.error('Failed to resend verification email:', error)
    return NextResponse.json({ error: 'Could not send email. Try again shortly.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Verification email sent' })
}
