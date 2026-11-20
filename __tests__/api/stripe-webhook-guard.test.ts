/**
 * @jest-environment node
 */
const list = jest.fn()
const expire = jest.fn()
const constructEvent = jest.fn()

jest.mock('@/lib/db/client', () => ({ db: { user: { update: jest.fn(), findUnique: jest.fn() } } }))
jest.mock('@/lib/notifications/email', () => ({
  sendWebhookFailureAlert: jest.fn(),
  sendCancellationEmail: jest.fn(),
  sendPaymentFailedEmail: jest.fn(),
}))
jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: (...a: unknown[]) => constructEvent(...a) },
    checkout: { sessions: { list: (...a: unknown[]) => list(...a), expire: (...a: unknown[]) => expire(...a) } },
  },
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/webhook/route'
import { _failures } from '@/lib/stripe-hardening'

const send = (type: string, object: Record<string, unknown>) => {
  constructEvent.mockReturnValue({ id: 'evt_1', type, data: { object } })
  return POST(new NextRequest('http://x/api/stripe/webhook', { method: 'POST', body: '{}', headers: { 'stripe-signature': 'sig' } }))
}

describe('webhook card-testing guard', () => {
  beforeEach(() => {
    _failures.clear()
    list.mockReset().mockResolvedValue({ data: [{ id: 'cs_1', metadata: { product: 'subscription-incinerator' } }] })
    expire.mockReset()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('expires the session after the second failed card', async () => {
    expect((await send('setup_intent.setup_failed', { id: 'seti_1', customer: 'cus_1' })).status).toBe(200)
    expect(expire).not.toHaveBeenCalled()
    expect((await send('setup_intent.setup_failed', { id: 'seti_1', customer: 'cus_1' })).status).toBe(200)
    expect(expire).toHaveBeenCalledWith('cs_1')
  })

  it('counts charge failures too', async () => {
    await send('payment_intent.payment_failed', { id: 'pi_1', customer: 'cus_2' })
    await send('payment_intent.payment_failed', { id: 'pi_1', customer: 'cus_2' })
    expect(expire).toHaveBeenCalledWith('cs_1')
  })

  it('still returns 200 if expiring fails', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {})
    list.mockRejectedValue(new Error('stripe down'))
    await send('setup_intent.setup_failed', { id: 'seti_3', customer: 'cus_3' })
    expect((await send('setup_intent.setup_failed', { id: 'seti_3', customer: 'cus_3' })).status).toBe(200)
    err.mockRestore()
  })
})
