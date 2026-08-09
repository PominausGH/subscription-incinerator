/**
 * @jest-environment node
 */

import { hashPassword, verifyPassword } from '@/lib/password'

describe('password utilities', () => {
  it('should hash a password', async () => {
    const hash = await hashPassword('testPassword123!')
    expect(hash).toBeDefined()
    expect(hash).not.toBe('testPassword123!')
    expect(hash.startsWith('$2')).toBe(true)
  })

  it('should verify a correct password', async () => {
    const hash = await hashPassword('testPassword123!')
    const isValid = await verifyPassword('testPassword123!', hash)
    expect(isValid).toBe(true)
  })

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('testPassword123!')
    const isValid = await verifyPassword('wrongPassword', hash)
    expect(isValid).toBe(false)
  })

  it('should produce different hashes for the same password', async () => {
    const hash1 = await hashPassword('testPassword123!')
    const hash2 = await hashPassword('testPassword123!')
    expect(hash1).not.toBe(hash2)
  })
})
