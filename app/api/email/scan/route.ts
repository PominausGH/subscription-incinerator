import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { addScanJob } from '@/lib/queue/scan-queue'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user has connected Gmail
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { emailProvider: true, oauthTokens: true },
    })

    if (!user || user.emailProvider !== 'gmail' || !user.oauthTokens) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect Gmail first.' },
        { status: 400 }
      )
    }

    // Add scan job
    const job = await addScanJob({
      userId,
      fullScan: true, // Manual scans are full scans
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Scan started. This may take a few minutes.',
    })
  } catch (error) {
    console.error('Manual scan error:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}
