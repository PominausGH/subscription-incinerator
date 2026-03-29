import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { getCancellationSteps, getCancellationUrl } from '@/lib/services/cancellation'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await db.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { serviceName: true, cancellationUrl: true },
  })
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const config = await db.serviceConfig.findFirst({
    where: { serviceName: { equals: sub.serviceName, mode: 'insensitive' } },
    select: { cancellationUrl: true, cancellationInstructions: true },
  })

  await db.cancellationAttempt.create({
    data: {
      subscriptionId: params.id,
      method: 'guided',
      status: 'in_progress',
    },
  })

  return NextResponse.json({
    steps: getCancellationSteps(config),
    cancellationUrl: getCancellationUrl(config, sub.cancellationUrl),
    hasServiceConfig: !!config,
  })
}
