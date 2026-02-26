import { NextRequest, NextResponse } from 'next/server'
import { auth, isPremium } from '@/lib/auth'
import { processBankStatement } from '@/lib/bank-import/processor'
import { BankImportError } from '@/lib/bank-import/errors'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Please sign in to continue' },
        { status: 401 }
      )
    }

    // Rate limit expensive bank import processing
    const rateLimit = await checkRateLimit(`bank-import:${session.user.id}`, RATE_LIMITS.expensive)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset)
    }

    // Check premium tier
    if (!isPremium({ tier: session.user.tier })) {
      return NextResponse.json(
        { error: 'Premium subscription required for bank import' },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'Please select a file to upload' },
        { status: 400 }
      )
    }

    const result = await processBankStatement(file)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bank import error:', error)

    if (error instanceof BankImportError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.userMessage,
          recoverable: error.recoverable
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again.',
        recoverable: true
      },
      { status: 500 }
    )
  }
}
