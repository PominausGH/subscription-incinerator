/**
 * @jest-environment node
 */

import { registerSchema, loginSchema } from '@/lib/validations/auth'

describe('registerSchema', () => {
  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123!',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'SecurePass123!',
    })
    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anyPassword',
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing email', () => {
    const result = loginSchema.safeParse({
      password: 'anyPassword',
    })
    expect(result.success).toBe(false)
  })
})
