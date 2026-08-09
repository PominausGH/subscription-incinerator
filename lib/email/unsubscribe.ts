import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET is required for unsubscribe tokens')
  return s
}

function sign(email: string): Buffer {
  return createHmac('sha256', getSecret()).update(email).digest()
}

export function generateUnsubscribeToken(email: string): string {
  const normalized = email.trim().toLowerCase()
  const payload = Buffer.from(normalized).toString('base64url')
  const sig = sign(normalized).toString('base64url')
  return `${payload}.${sig}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  try {
    const email = Buffer.from(parts[0], 'base64url').toString('utf8')
    const given = Buffer.from(parts[1], 'base64url')
    const expected = sign(email)
    if (given.length !== expected.length) return null
    if (!timingSafeEqual(given, expected)) return null
    return email
  } catch {
    return null
  }
}

export function unsubscribeUrl(email: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}/api/unsubscribe?token=${generateUnsubscribeToken(email)}`
}
