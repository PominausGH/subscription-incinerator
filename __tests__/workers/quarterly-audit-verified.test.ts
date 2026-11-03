/**
 * @jest-environment node
 */
import { processQuarterlyAudit } from '@/workers/processors/quarterly-audit'
import { db } from '@/lib/db/client'
import { emailService } from '@/lib/services/email'

jest.mock('@/lib/db/client', () => ({
  db: { user: { findMany: jest.fn(), update: jest.fn() } },
}))
jest.mock('@/lib/services/email', () => ({
  emailService: { scheduleQuarterlyAudit: jest.fn().mockResolvedValue(true) },
}))

describe('processQuarterlyAudit email verification gate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('only selects users whose email has been verified', async () => {
    ;(db.user.findMany as jest.Mock).mockResolvedValue([])
    await processQuarterlyAudit()
    const where = (db.user.findMany as jest.Mock).mock.calls[0][0].where
    expect(where.emailVerified).toEqual({ not: null })
    expect(emailService.scheduleQuarterlyAudit).not.toHaveBeenCalled()
  })
})
