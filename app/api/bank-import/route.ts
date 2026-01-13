import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { processBankStatement } from '@/lib/bank-import/processor'
import { BankImportError } from '@/lib/bank-import/errors'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Please sign in to continue' },
        { status: 401 }
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
