import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'

async function recordUnsubscribe(token: string | null): Promise<string | null> {
  if (!token) return null
  const email = verifyUnsubscribeToken(token)
  if (!email) return null
  await db.emailUnsubscribe.upsert({
    where: { email },
    update: {},
    create: { email },
  })
  return email
}

function htmlPage(title: string, message: string, ok: boolean): string {
  const accent = ok ? '#22c55e' : '#ef4444'
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Subscription Incinerator</title>
<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111; color: #e5e7eb; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.card { max-width: 480px; background: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 40px 32px; text-align: center; }
.icon { font-size: 32px; margin-bottom: 12px; }
h1 { color: #fff; font-size: 22px; margin: 0 0 12px; }
p { color: #9ca3af; font-size: 15px; line-height: 1.5; margin: 0 0 8px; }
.email { color: ${accent}; font-weight: 600; }
.footer { margin-top: 24px; color: #6b7280; font-size: 13px; }
a { color: #f87171; text-decoration: none; }
</style>
</head>
<body>
<div class="card">
<div class="icon">${ok ? '✓' : '⚠'}</div>
<h1>${title}</h1>
<p>${message}</p>
<div class="footer"><a href="https://subscriptionincinerator.app">subscriptionincinerator.app</a></div>
</div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  try {
    const email = await recordUnsubscribe(token)
    if (!email) {
      return new NextResponse(
        htmlPage(
          'Invalid unsubscribe link',
          'This link is invalid or has expired. If you keep receiving emails, reply to one and we will remove you manually.',
          false,
        ),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
      )
    }
    return new NextResponse(
      htmlPage(
        "You're unsubscribed",
        `<span class="email">${email}</span> has been removed. You will not receive further emails from us.`,
        true,
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  } catch (err) {
    console.error('Unsubscribe error:', err)
    return new NextResponse(
      htmlPage('Something went wrong', 'Please try again in a moment.', false),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const email = await recordUnsubscribe(token)
  if (!email) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
