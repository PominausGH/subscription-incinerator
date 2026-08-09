import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db/client'
import { unsubscribeUrl } from '@/lib/email/unsubscribe'

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
})

function renderChecklistEmail(unsubUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Subscription Audit Checklist</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111; color: #e5e7eb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 32px; }
    h1 { color: #fff; font-size: 24px; margin: 12px 0 4px; }
    .subtitle { color: #9ca3af; font-size: 14px; }
    .card { background: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .step { display: flex; gap: 16px; margin-bottom: 14px; }
    .step-num { width: 28px; height: 28px; background: rgba(239,68,68,0.2); border-radius: 50%; text-align: center; line-height: 28px; font-size: 12px; font-weight: bold; color: #f87171; flex-shrink: 0; margin-right: 12px; }
    .step-content { }
    .step-title { color: #fff; font-weight: 600; font-size: 14px; margin: 0 0 2px; }
    .step-desc { color: #9ca3af; font-size: 13px; margin: 0; }
    .cta { text-align: center; margin-top: 32px; }
    .btn { display: inline-block; background: #ef4444; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .footer { text-align: center; margin-top: 32px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔥</div>
      <h1>Your Subscription Audit Checklist</h1>
      <p class="subtitle">10 places to check — run through this once a quarter</p>
    </div>

    <div class="card">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-content">
          <p class="step-title">Gmail / Email Inbox</p>
          <p class="step-desc">Search: receipt, invoice, subscription, "billing confirmation". Flag anything recurring you don't recognise.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-content">
          <p class="step-title">Primary Bank Account</p>
          <p class="step-desc">Download last 3 months. Sort by amount. Mark every recurring charge.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-content">
          <p class="step-title">Credit Card(s)</p>
          <p class="step-desc">Repeat for each card. Different cards often have different subscriptions.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">4</div>
        <div class="step-content">
          <p class="step-title">PayPal Recurring Payments</p>
          <p class="step-desc">paypal.com → Account Settings → Payments → Manage automatic payments.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">5</div>
        <div class="step-content">
          <p class="step-title">Apple Subscriptions</p>
          <p class="step-desc">Settings → [your name] → Subscriptions. Check both active and expired.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">6</div>
        <div class="step-content">
          <p class="step-title">Google Play Subscriptions</p>
          <p class="step-desc">Play Store → profile → Payments & subscriptions → Subscriptions.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">7</div>
        <div class="step-content">
          <p class="step-title">Amazon Memberships</p>
          <p class="step-desc">amazon.com → Account → Memberships & Subscriptions. Check Prime, Channels, Audible, Kindle Unlimited separately.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">8</div>
        <div class="step-content">
          <p class="step-title">Software / SaaS Tools</p>
          <p class="step-desc">Adobe, Microsoft 365, Canva, Figma, Notion, Dropbox, VPNs — check billing in each app.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">9</div>
        <div class="step-content">
          <p class="step-title">Domain & Hosting Registrars</p>
          <p class="step-desc">Annual auto-renewals for domains you may no longer need.</p>
        </div>
      </div>
      <div class="step" style="margin-bottom:0">
        <div class="step-num">10</div>
        <div class="step-content">
          <p class="step-title">The Keep-or-Cancel Test</p>
          <p class="step-desc">For each one: Have I used this in 30 days? Would I sign up today at this price? If both answers are no — cancel.</p>
        </div>
      </div>
    </div>

    <div class="cta">
      <p style="color:#9ca3af; font-size:14px; margin-bottom:16px;">
        Want to automate this? Subscription Incinerator scans your Gmail and bank imports to find recurring charges for you.
      </p>
      <a href="https://subscriptionincinerator.app/login" class="btn">Start Free →</a>
    </div>

    <div class="footer">
      <p>You requested this checklist from Subscription Incinerator.<br>No spam — this is the only email we'll send.</p>
      <p style="margin-top:12px;"><a href="${unsubUrl}" style="color:#6b7280; text-decoration:underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
`
}

export async function POST(request: NextRequest) {
  let email: string
  try {
    const body = await request.json()
    email = (body.email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const unsubscribed = await db.emailUnsubscribe.findUnique({ where: { email } })
  if (unsubscribed) {
    return NextResponse.json({ success: true })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://subscriptionincinerator.app'
  const unsubUrl = unsubscribeUrl(email, baseUrl)

  try {
    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        'Subscription Incinerator <noreply@subscriptionincinerator.app>',
      to: email,
      subject: 'Your Subscription Audit Checklist 🔥',
      html: renderChecklistEmail(unsubUrl),
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>, <mailto:unsubscribe@subscriptionincinerator.app>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Checklist email send error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
