import { randomBytes } from 'crypto'

export const HOUSEHOLD_INVITE_EXPIRY_DAYS = 7

export function generateInviteToken(): string {
  return randomBytes(32).toString('hex')
}

export function inviteExpiryDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + HOUSEHOLD_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
}
