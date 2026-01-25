import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required')
  }
  // Derive a 32-byte key from the secret using scrypt
  return scryptSync(secret, 'oauth-token-salt', 32)
}

export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Combine IV + authTag + encrypted data
  return iv.toString('hex') + authTag.toString('hex') + encrypted
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()
  
  // Extract IV, authTag, and encrypted data
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
