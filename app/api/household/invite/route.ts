import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { generateInviteToken, inviteExpiryDate } from '@/lib/household/invite'
import { sendHouseholdInviteEmail } from '@/lib/notifications/email'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(`household-invite:${clientId}`, RATE_LIMITS.auth)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email } = inviteSchema.parse(body)
    const inviteEmail = email.toLowerCase()

    const requester = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, householdOwnerId: true },
    })

    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (requester.householdOwnerId) {
      return NextResponse.json(
        { error: "You're already part of a household. Leave it before inviting others." },
        { status: 400 }
      )
    }

    if (inviteEmail === requester.email.toLowerCase()) {
      return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 })
    }

    const existingMember = await db.user.findFirst({
      where: { email: inviteEmail, householdOwnerId: requester.id },
    })
    if (existingMember) {
      return NextResponse.json({ error: 'That person is already in your household' }, { status: 400 })
    }

    // Replace any existing pending invite to this email rather than piling up tokens
    const existingInvite = await db.householdInvite.findFirst({
      where: { ownerId: requester.id, email: inviteEmail, status: 'pending' },
    })

    const token = generateInviteToken()
    const expiresAt = inviteExpiryDate()

    if (existingInvite) {
      await db.householdInvite.update({
        where: { id: existingInvite.id },
        data: { token, expiresAt },
      })
    } else {
      await db.householdInvite.create({
        data: { ownerId: requester.id, email: inviteEmail, token, expiresAt },
      })
    }

    try {
      await sendHouseholdInviteEmail({ toEmail: inviteEmail, ownerEmail: requester.email, token })
    } catch (error) {
      console.error('Failed to send household invite email:', error)
      return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Send household invite error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
