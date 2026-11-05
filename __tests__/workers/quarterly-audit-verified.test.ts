/**
 * @jest-environment node
 */
import { processQuarterlyAudit } from '@/workers/processors/quarterly-audit'
import { db } from '@/lib/db/client'
import { emailService } from '@/lib/services/email'

jest.mock('@/lib/db/client', () => ({
  db: {
    user: { findMany: jest.fn(), update: jest.fn() },
    emailUnsubscribe: { findUnique: jest.fn() },
  },
}))
jest.mock('@/lib/services/email', () => ({
  emailService: { scheduleQuarterlyAudit: jest.fn().mockResolvedValue(true) },
}))

const findMany = db.user.findMany as jest.Mock
const findUnsub = db.emailUnsubscribe.findUnique as jest.Mock
const send = emailService.scheduleQuarterlyAudit as jest.Mock
const user = (over: Record<string, unknown> = {}) => ({
  id: 'u1', email: 'Someone@Example.com', name: 'Sam', notificationPreferences: null, ...over,
})

describe('processQuarterlyAudit gates', () => {
  const secret = process.env.NEXTAUTH_SECRET
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXTAUTH_SECRET = 'test-secret'
    findUnsub.mockResolvedValue(null)
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterAll(() => { process.env.NEXTAUTH_SECRET = secret })

  it('only selects users whose email has been verified', async () => {
    findMany.mockResolvedValue([])
    await processQuarterlyAudit()
    expect(findMany.mock.calls[0][0].where.emailVerified).toEqual({ not: null })
    expect(send).not.toHaveBeenCalled()
  })

  it('does nothing when the unsubscribe-signing secret is missing', async () => {
    delete process.env.NEXTAUTH_SECRET
    const result = await processQuarterlyAudit()
    expect(result).toMatchObject({ sent: 0, skipped: 'missing-secret' })
    expect(findMany).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('skips unsubscribed addresses (case-insensitive) and mails the rest', async () => {
    findMany.mockResolvedValue([user({ id: 'u1' }), user({ id: 'u2', email: 'other@example.com' })])
    findUnsub.mockImplementation(({ where }: any) =>
      Promise.resolve(where.email === 'someone@example.com' ? { email: where.email } : null))
    const result = await processQuarterlyAudit()
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith('other@example.com', 'Sam')
    expect(result).toMatchObject({ checked: 2, sent: 1 })
  })
})
