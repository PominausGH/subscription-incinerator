import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.enum(['billing', 'account', 'feature', 'bug', 'other']),
  message: z.string().min(10).max(2000),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Log to console — replace with email provider when configured
    console.log('[contact form]', {
      from: `${data.name} <${data.email}>`,
      subject: data.subject,
      message: data.message,
      ts: new Date().toISOString(),
    })

    // If SUPPORT_EMAIL is configured, forward via nodemailer / sendgrid / etc.
    // For now just acknowledge receipt.

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    console.error('[contact] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
