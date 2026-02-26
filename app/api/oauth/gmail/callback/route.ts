import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { db } from '@/lib/db/client'
import { addScanJob, scheduleRecurringScan } from '@/lib/queue/scan-queue'
import { encryptOAuthTokens, decrypt } from '@/lib/crypto'
import { auth } from '@/lib/auth'

const STATE_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent('Gmail connection failed')}`, req.url)
      )
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Invalid callback parameters' }, { status: 400 })
    }

    // Verify the signed state token
    let statePayload: { userId: string; timestamp: number }
    try {
      const decrypted = decrypt(state)
      statePayload = JSON.parse(decrypted)
    } catch {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
    }

    // Check state token hasn't expired
    if (Date.now() - statePayload.timestamp > STATE_MAX_AGE_MS) {
      return NextResponse.redirect(
        new URL('/settings?error=oauth_expired', req.url)
      )
    }

    // Verify the current session matches the state token
    const session = await auth()
    if (!session?.user?.id || session.user.id !== statePayload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = statePayload.userId

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json({ error: 'Failed to get tokens' }, { status: 500 })
    }

    // Get the Gmail email address for this account
    oauth2Client.setCredentials(tokens)
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const gmailEmail = profile.data.emailAddress || ''

    // Store tokens (encrypted)
    const encryptedTokens = encryptOAuthTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      email: gmailEmail,
    })

    await db.user.update({
      where: { id: userId },
      data: {
        oauthTokens: encryptedTokens,
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
