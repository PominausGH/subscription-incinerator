import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { z } from 'zod'

const CreateSchema = z.object({
  name:         z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currency:     z.string().length(3).default('USD'),
  deadline:     z.string().datetime().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const goals = await db.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const goal = await db.savingsGoal.create({
    data: {
      userId:       session.user.id,
      name:         parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currency:     parsed.data.currency,
      deadline:     parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    },
  })
  return NextResponse.json(goal, { status: 201 })
}
