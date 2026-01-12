import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication using NextAuth v5
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscriptionId = params.id

    // Fetch subscription and check ownership
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        userId: true,
        serviceName: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Look up service config
    const serviceConfig = await db.serviceConfig.findUnique({
      where: { serviceName: subscription.serviceName },
      select: {
        serviceName: true,
        cancellationUrl: true,
        supportUrl: true,
        logoUrl: true,
        cancellationInstructions: true,
      },
    })

    if (serviceConfig && serviceConfig.cancellationInstructions) {
      return NextResponse.json({
        serviceName: serviceConfig.serviceName,
        cancellationUrl: serviceConfig.cancellationUrl,
        supportUrl: serviceConfig.supportUrl,
        logoUrl: serviceConfig.logoUrl,
        instructions: serviceConfig.cancellationInstructions,
      })
    }

    // Return generic fallback if no config found
    return NextResponse.json({
      serviceName: subscription.serviceName,
      cancellationUrl: null,
      supportUrl: null,
      logoUrl: null,
      instructions: [
        'Log in to your account on the service website',
        'Navigate to Account Settings or Subscription Management',
        'Look for "Cancel Subscription" or "Manage Plan" option',
        'Follow the cancellation flow and confirm',
        'Save or screenshot any confirmation number',
        'Check your email for cancellation confirmation',
      ],
    })
  } catch (error) {
    console.error('Error fetching cancel instructions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
