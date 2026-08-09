import { db } from './lib/db/client'
import { google } from 'googleapis'

async function testScanQuery() {
  try {
    console.log('Fetching user...')
    const user = await db.user.findFirst({
      where: { emailProvider: 'gmail' },
      select: { id: true, email: true, oauthTokens: true }
    })

    if (!user || !user.oauthTokens) {
      console.log('No user with Gmail connected')
      process.exit(1)
    }

    const tokens = user.oauthTokens as any
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Test the subscription query
    const afterDate = new Date()
    afterDate.setDate(afterDate.getDate() - 90)
    const dateStr = Math.floor(afterDate.getTime() / 1000)

    console.log('\n--- Test 1: Default subscription query ---')
    const query1 = `subscription OR trial OR "free trial" OR "billing" OR "payment" after:${dateStr}`
    console.log('Query:', query1)
    const response1 = await gmail.users.messages.list({
      userId: 'me',
      q: query1,
      maxResults: 500,
    })
    console.log('Messages found:', response1.data.messages?.length || 0)

    console.log('\n--- Test 2: Frequency analysis query ---')
    const query2 = `from:noreply OR from:no-reply OR from:billing OR from:receipts OR from:invoice OR subject:receipt OR subject:invoice OR subject:payment OR subject:confirmation OR subject:"your order" after:${dateStr}`
    console.log('Query:', query2)
    const response2 = await gmail.users.messages.list({
      userId: 'me',
      q: query2,
      maxResults: 300,
    })
    console.log('Messages found:', response2.data.messages?.length || 0)

    console.log('\n--- Test 3: Broader query ---')
    const query3 = `after:${dateStr}`
    console.log('Query:', query3)
    const response3 = await gmail.users.messages.list({
      userId: 'me',
      q: query3,
      maxResults: 50,
    })
    console.log('Messages found:', response3.data.messages?.length || 0)

    if (response3.data.messages?.length) {
      console.log('\nSample email subjects:')
      for (const msg of response3.data.messages.slice(0, 5)) {
        const msgData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From'],
        })
        const subject = msgData.data.payload?.headers?.find(h => h.name === 'Subject')?.value
        const from = msgData.data.payload?.headers?.find(h => h.name === 'From')?.value
        console.log(`  - From: ${from?.slice(0, 50)}...`)
        console.log(`    Subject: ${subject?.slice(0, 60)}...`)
      }
    }

  } catch (error: any) {
    console.error('Error:', error.message)
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2))
    }
  } finally {
    await db.$disconnect()
  }
}

testScanQuery()
