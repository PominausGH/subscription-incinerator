import { db } from './lib/db/client'
import { google } from 'googleapis'

async function testGmailAPI() {
  try {
    console.log('Fetching user with Gmail connected...')
    const user = await db.user.findFirst({
      where: { emailProvider: 'gmail' },
      select: { id: true, email: true, oauthTokens: true }
    })

    if (!user || !user.oauthTokens) {
      console.log('❌ No user with Gmail connected')
      process.exit(1)
    }

    console.log('✓ Found user:', user.email)

    const tokens = user.oauthTokens as any
    console.log('✓ Has access token:', !!tokens.accessToken)
    console.log('✓ Has refresh token:', !!tokens.refreshToken)

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    })

    console.log('\n🔍 Testing Gmail API access...')
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    console.log('Attempting to list messages (limit 1)...')
    const startTime = Date.now()

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1,
    })

    const elapsed = Date.now() - startTime
    console.log(`✓ Gmail API response received in ${elapsed}ms`)
    console.log('✓ Messages found:', response.data.messages?.length || 0)
    console.log('✓ Result size estimate:', response.data.resultSizeEstimate)

    console.log('\n✅ Gmail API is working correctly!')

  } catch (error: any) {
    console.error('\n❌ Gmail API Error:')
    console.error('Error message:', error.message)
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Status text:', error.response.statusText)
      console.error('Data:', JSON.stringify(error.response.data, null, 2))
    }

    if (error.message?.includes('403')) {
      console.log('\n📝 This usually means:')
      console.log('   1. Gmail API is not enabled in Google Cloud Console')
      console.log('   2. Go to: https://console.cloud.google.com/apis/library/gmail.googleapis.com')
      console.log('   3. Click "Enable"')
    }

    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

testGmailAPI()
