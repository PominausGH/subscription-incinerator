import { randomBytes } from 'crypto'

export const PASSWORD_RESET_EXPIRY_MINUTES = 60

export function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

export function resetExpiryDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000)
}
