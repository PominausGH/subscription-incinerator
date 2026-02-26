import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { google } from 'googleapis'
import { encrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    // Create a signed state token containing the userId and a timestamp
    const statePayload = JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
    })
    const signedState = encrypt(statePayload)

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      state: signedState,
      prompt: 'consent', // Force consent to get refresh token
    })

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Gmail OAuth error:', error)
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  }
}
