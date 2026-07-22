import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { hashPassword, verifyPassword } from '@/lib/password'
import { changePasswordSchema } from '@/lib/validations/auth'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(`change-password:${session.user.id}`, RATE_LIMITS.auth)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset)
    }

    const body = await req.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Account has no password set' }, { status: 400 })
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const passwordHash = await hashPassword(newPassword)
    await db.user.update({ where: { id: session.user.id }, data: { passwordHash } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
