import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { hashPassword } from '@/lib/password'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

const acceptSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(`household-accept:${clientId}`, RATE_LIMITS.auth)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset)
    }

    const body = await req.json()
    const { token, password } = acceptSchema.parse(body)

    const invite = await db.householdInvite.findUnique({ where: { token } })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invite has already been used or revoked' }, { status: 400 })
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email: invite.email } })

    if (existingUser) {
      const session = await auth()

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Log in with that email address first, then accept the invite', requiresLogin: true },
          { status: 401 }
        )
      }

      if (session.user.id !== existingUser.id) {
        return NextResponse.json(
          { error: `This invite is for ${invite.email} - log in with that account to accept it` },
          { status: 403 }
        )
      }

      if (existingUser.householdOwnerId) {
        return NextResponse.json(
          { error: "You're already part of a household. Leave it before accepting a new invite." },
          { status: 400 }
        )
      }

      const ownedMemberCount = await db.user.count({ where: { householdOwnerId: existingUser.id } })
      if (ownedMemberCount > 0) {
        return NextResponse.json(
          { error: 'You already have your own household with members. Leave it before joining another.' },
          { status: 400 }
        )
      }

      await db.$transaction([
        db.user.update({ where: { id: existingUser.id }, data: { householdOwnerId: invite.ownerId } }),
        db.householdInvite.update({ where: { id: invite.id }, data: { status: 'accepted', acceptedAt: new Date() } }),
      ])

      return NextResponse.json({ success: true, createdAccount: false }, { status: 200 })
    }

    if (!password) {
      return NextResponse.json(
        { error: 'A password is required to create your account', requiresPassword: true },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    await db.$transaction([
      db.user.create({
        data: {
          email: invite.email,
          passwordHash,
          emailVerified: new Date(),
          householdOwnerId: invite.ownerId,
        },
      }),
      db.householdInvite.update({ where: { id: invite.id }, data: { status: 'accepted', acceptedAt: new Date() } }),
    ])

    return NextResponse.json({ success: true, createdAccount: true }, { status: 201 })
  } catch (error) {
    console.error('Accept household invite error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
