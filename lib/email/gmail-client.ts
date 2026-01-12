import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface GmailMessage {
  id: string
  threadId: string
  from: string
  subject: string
  body: string
  date: Date
  snippet: string
}

export function createGmailClient(accessToken: string, refreshToken: string): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return oauth2Client
}

export async function fetchGmailMessages(
  oauth2Client: OAuth2Client,
  options: {
    maxResults?: number
    afterDate?: Date
    query?: string
  } = {}
): Promise<GmailMessage[]> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  // Build query
  let query = options.query || 'subscription OR trial OR "free trial" OR "billing" OR "payment"'

  if (options.afterDate) {
    const dateStr = Math.floor(options.afterDate.getTime() / 1000)
    query += ` after:${dateStr}`
  }

  // List messages
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: options.maxResults || 50,
  })

  if (!listResponse.data.messages) {
    return []
  }

  // Fetch full message details
  const messages: GmailMessage[] = []

  for (const message of listResponse.data.messages) {
    if (!message.id) continue

    const msgResponse = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full',
    })

    const msg = msgResponse.data
    const headers = msg.payload?.headers || []

    const from = headers.find((h) => h.name === 'From')?.value || ''
    const subject = headers.find((h) => h.name === 'Subject')?.value || ''
    const dateStr = headers.find((h) => h.name === 'Date')?.value || ''

    // Get body
    let body = ''
    if (msg.payload?.body?.data) {
      body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8')
    } else if (msg.payload?.parts) {
      const textPart = msg.payload.parts.find((part) => part.mimeType === 'text/plain')
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
      }
    }

    messages.push({
      id: msg.id || '',
      threadId: msg.threadId || '',
      from,
      subject,
      body,
      date: dateStr ? new Date(dateStr) : new Date(),
      snippet: msg.snippet || '',
    })
  }

  return messages
}

export async function refreshGmailToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()

  return {
    accessToken: credentials.access_token || '',
    refreshToken: credentials.refresh_token || refreshToken,
  }
}
