import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { hashVerificationToken } from '@/lib/email-verification'
import { emailService } from '@/lib/services/email'

function appUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || 'https://subscriptionincinerator.app')
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(appUrl('/dashboard?verified=invalid'))

  const record = await db.verificationToken.findUnique({ where: { token: hashVerificationToken(token) } })
  if (!record || record.expires < new Date()) {
    if (record) await db.verificationToken.deleteMany({ where: { token: record.token } })
    return NextResponse.redirect(appUrl('/dashboard?verified=invalid'))
  }

  // Only flips unverified accounts, so a replayed link can't re-send the welcome email.
  const { count } = await db.user.updateMany({
    where: { email: record.identifier, emailVerified: null },
    data: { emailVerified: new Date() },
  })
  await db.verificationToken.deleteMany({ where: { token: record.token } })

  if (count > 0) {
    emailService.sendWelcome(record.identifier, 'there').catch((e: unknown) => {
      console.error('Failed to send welcome email:', e)
    })
  }

  return NextResponse.redirect(appUrl('/dashboard?verified=1'))
}
