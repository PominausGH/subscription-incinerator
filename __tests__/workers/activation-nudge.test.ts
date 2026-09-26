/**
 * @jest-environment node
 */
import { processActivationNudge } from '@/workers/processors/activation-nudge'
import { db } from '@/lib/db/client'
import { emailService } from '@/lib/services/email'
import { connection } from '@/lib/queue/client'

jest.mock('@/lib/db/client', () => ({
  db: {
    user: { findMany: jest.fn() },
    emailUnsubscribe: { findUnique: jest.fn() },
  },
}))
jest.mock('@/lib/services/email', () => ({
  emailService: { sendActivationNudge: jest.fn() },
}))
jest.mock('@/lib/queue/client', () => ({
  connection: { set: jest.fn(), del: jest.fn() },
}))

const findMany = db.user.findMany as jest.Mock
const findUnsub = db.emailUnsubscribe.findUnique as jest.Mock
const send = emailService.sendActivationNudge as jest.Mock
const redisSet = connection.set as unknown as jest.Mock
const redisDel = connection.del as unknown as jest.Mock

const user = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'Someone@Example.com',
  name: 'Sam',
  notificationPreferences: { sms: false, push: true, email: true },
  ...over,
})

describe('processActivationNudge', () => {
  const originalSecret = process.env.NEXTAUTH_SECRET

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXTAUTH_SECRET = 'test-secret'
    findUnsub.mockResolvedValue(null)
    redisSet.mockResolvedValue('OK')
    send.mockResolvedValue(true)
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterAll(() => {
    process.env.NEXTAUTH_SECRET = originalSecret
  })

  it('does nothing when the unsubscribe secret is missing', async () => {
    delete process.env.NEXTAUTH_SECRET
    const result = await processActivationNudge()
    expect(result).toMatchObject({ sent: 0, skipped: 'missing-secret' })
    expect(findMany).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('selects signups 2-14 days old with no subscriptions', async () => {
    findMany.mockResolvedValue([])
    const before = Date.now()
    await processActivationNudge()

    const where = findMany.mock.calls[0][0].where
    expect(where.subscriptions).toEqual({ none: {} })
    const day = 24 * 60 * 60 * 1000
    expect(before - where.createdAt.lte.getTime()).toBeGreaterThanOrEqual(2 * day - 1000)
    expect(before - where.createdAt.gte.getTime()).toBeGreaterThanOrEqual(14 * day - 1000)
  })

  it('sends once to an eligible user, lowercasing the address', async () => {
    findMany.mockResolvedValue([user()])
    const result = await processActivationNudge()

    expect(result).toEqual({ checked: 1, sent: 1 })
    expect(send).toHaveBeenCalledWith('someone@example.com', 'Sam')
    expect(redisSet).toHaveBeenCalledWith('activation-nudge:sent:u1', '1', 'EX', expect.any(Number), 'NX')
  })

  it('falls back to a generic greeting when the user has no name', async () => {
    findMany.mockResolvedValue([user({ name: null })])
    await processActivationNudge()
    expect(send).toHaveBeenCalledWith('someone@example.com', 'there')
  })

  it('skips unsubscribed addresses', async () => {
    findMany.mockResolvedValue([user()])
    findUnsub.mockResolvedValue({ email: 'someone@example.com' })
    const result = await processActivationNudge()
    expect(result.sent).toBe(0)
    expect(send).not.toHaveBeenCalled()
  })

  it.each([
    ['flat email flag', { email: false }],
    ['channels.email flag', { channels: { email: false } }],
  ])('skips users who turned email off (%s)', async (_label, prefs) => {
    findMany.mockResolvedValue([user({ notificationPreferences: prefs })])
    await processActivationNudge()
    expect(send).not.toHaveBeenCalled()
  })

  it('never emails the same user twice', async () => {
    findMany.mockResolvedValue([user()])
    redisSet.mockResolvedValue(null) // key already claimed by an earlier run
    const result = await processActivationNudge()
    expect(result.sent).toBe(0)
    expect(send).not.toHaveBeenCalled()
  })

  it('releases the claim when delivery fails so tomorrow can retry', async () => {
    findMany.mockResolvedValue([user()])
    send.mockResolvedValue(false)
    const result = await processActivationNudge()
    expect(result.sent).toBe(0)
    expect(redisDel).toHaveBeenCalledWith('activation-nudge:sent:u1')
  })
})
