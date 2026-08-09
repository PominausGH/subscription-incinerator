import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import nodemailer from 'nodemailer'

const CATEGORY_LABELS = {
  billing: 'Billing & Payments',
  account: 'Account Issue',
  bug: 'Bug report',
  feature: 'Feature request',
  feedback: 'General feedback',
} as const

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  category: z.enum(['billing', 'account', 'bug', 'feature', 'feedback']),
  message: z.string().min(10).max(2000),
  userAgent: z.string().max(500).optional(),
  pageUrl: z.string().max(500).optional(),
})

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
})

const CONTACT_NOTIFICATION_EMAIL =
  process.env.CONTACT_NOTIFICATION_EMAIL || 'andrew.dainty@gmail.com'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const categoryLabel = CATEGORY_LABELS[data.category]

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        'Subscription Incinerator <noreply@subscriptionincinerator.app>',
      to: CONTACT_NOTIFICATION_EMAIL,
      replyTo: data.email,
      subject: `[${categoryLabel}] New contact form submission from ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
        <p><strong>From:</strong> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</p>
        <hr/>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
        <hr/>
        <p><small>Submitted at: ${new Date().toISOString()}</small></p>
        ${data.pageUrl ? `<p><small>Page: ${escapeHtml(data.pageUrl)}</small></p>` : ''}
        ${data.userAgent ? `<p><small>User agent: ${escapeHtml(data.userAgent)}</small></p>` : ''}
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    console.error('[contact] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
