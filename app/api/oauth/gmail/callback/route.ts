import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { db } from '@/lib/db/client'
import { addScanJob, scheduleRecurringScan } from '@/lib/queue/scan-queue'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const userId = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent('Gmail connection failed')}`, req.url)
      )
    }

    if (!code || !userId) {
      return NextResponse.json({ error: 'Invalid callback parameters' }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json({ error: 'Failed to get tokens' }, { status: 500 })
    }

    // Store tokens (encrypted in production)
    await db.user.update({
      where: { id: userId },
      data: {
        oauthTokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
        emailProvider: 'gmail',
      },
    })

    // Queue initial full scan
    await addScanJob({
      userId,
      fullScan: true,
    })

    // Schedule recurring scan every 3 days
    await scheduleRecurringScan(userId)

    return NextResponse.redirect(
      new URL('/dashboard?connected=gmail', req.url)
    )
  } catch (error) {
    console.error('Gmail OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed', req.url)
    )
  }
}
