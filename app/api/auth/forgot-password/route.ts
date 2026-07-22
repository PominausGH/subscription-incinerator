import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { generateResetToken, resetExpiryDate } from '@/lib/password-reset'
import { sendPasswordResetEmail } from '@/lib/notifications/email'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(`forgot-password:${clientId}`, RATE_LIMITS.auth)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset)
    }

    const body = await req.json()
    const { email } = forgotPasswordSchema.parse(body)
    const normalizedEmail = email.toLowerCase()

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true },
    })

    // Always respond the same way regardless of whether the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    if (user?.passwordHash) {
      await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } })

      const token = generateResetToken()
      const expiresAt = resetExpiryDate()

      await db.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      })

      try {
        await sendPasswordResetEmail({ toEmail: normalizedEmail, token })
      } catch (error) {
        console.error('Failed to send password reset email:', error)
      }
    }

    return NextResponse.json({ message: 'If an account exists for that email, a reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
