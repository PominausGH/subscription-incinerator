import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/db/client'

export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex')
}

/** Only the hash is stored, so a DB read can't be turned into working verify links. */
export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function verificationExpiryDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000)
}

/**
 * Replace any outstanding token for this address with a fresh one and return the
 * raw token (to be emailed). Uses the NextAuth VerificationToken table.
 */
export async function createVerificationToken(email: string): Promise<string> {
  const identifier = email.toLowerCase()
  const token = generateVerificationToken()
  await db.verificationToken.deleteMany({ where: { identifier } })
  await db.verificationToken.create({
    data: { identifier, token: hashVerificationToken(token), expires: verificationExpiryDate() },
  })
  return token
}
