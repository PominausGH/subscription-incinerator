import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { hashPassword } from '@/lib/password'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(`reset-password:${clientId}`, RATE_LIMITS.auth)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset)
    }

    const body = await req.json()
    const { token, password } = resetPasswordSchema.parse(body)

    const resetToken = await db.passwordResetToken.findUnique({ where: { token } })

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await db.$transaction([
      db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
