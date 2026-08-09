import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32
const LEGACY_SALT = 'oauth-token-salt'

function deriveKey(salt: Buffer | string): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required')
  }
  return scryptSync(secret, salt, 32)
}

export function encrypt(text: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const key = deriveKey(salt)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Format: salt (64 hex) + IV (32 hex) + authTag (32 hex) + encrypted data
  return salt.toString('hex') + iv.toString('hex') + authTag.toString('hex') + encrypted
}

export function decrypt(encryptedText: string): string {
  // New format has salt prefix: salt (64 hex) + IV (32 hex) + authTag (32 hex) + data
  // Legacy format: IV (32 hex) + authTag (32 hex) + data
  // New format minimum length = 64 + 32 + 32 = 128+ chars
  // Legacy format minimum length = 32 + 32 = 64+ chars
  // Distinguish by trying new format first, fall back to legacy
  try {
    return decryptWithSalt(encryptedText)
  } catch {
    return decryptLegacy(encryptedText)
  }
}

function decryptWithSalt(encryptedText: string): string {
  const salt = Buffer.from(encryptedText.slice(0, SALT_LENGTH * 2), 'hex')
  const key = deriveKey(salt)

  const offset = SALT_LENGTH * 2
  const iv = Buffer.from(encryptedText.slice(offset, offset + IV_LENGTH * 2), 'hex')
  const authTag = Buffer.from(encryptedText.slice(offset + IV_LENGTH * 2, offset + IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2), 'hex')
  const encrypted = encryptedText.slice(offset + IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

function decryptLegacy(encryptedText: string): string {
  const key = deriveKey(LEGACY_SALT)

  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex')
  const authTag = Buffer.from(encryptedText.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2), 'hex')
  const encrypted = encryptedText.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiryDate?: number | null
  email?: string
}

export function encryptOAuthTokens(tokens: OAuthTokens): string {
  return encrypt(JSON.stringify(tokens))
}

export function decryptOAuthTokens(encryptedTokens: string): OAuthTokens {
  return JSON.parse(decrypt(encryptedTokens))
}
