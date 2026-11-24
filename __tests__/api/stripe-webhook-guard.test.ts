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

describe('webhook on a shared Stripe account', () => {
  const { db } = jest.requireMock('@/lib/db/client') as {
    db: { user: { update: jest.Mock; updateMany: jest.Mock; findUnique: jest.Mock } }
  }
  const { sendWebhookFailureAlert } = jest.requireMock('@/lib/notifications/email') as { sendWebhookFailureAlert: jest.Mock }

  beforeEach(() => {
    db.user.updateMany = jest.fn().mockResolvedValue({ count: 0 })
    db.user.update.mockReset()
    db.user.findUnique.mockReset()
    sendWebhookFailureAlert.mockReset()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it("ignores another product's checkout without touching the DB", async () => {
    const res = await send('checkout.session.completed', {
      id: 'cs_bp', customer: 'cus_bp', mode: 'subscription', metadata: { product: 'brightpath' },
    })
    expect(res.status).toBe(200)
    expect(db.user.updateMany).not.toHaveBeenCalled()
    expect(sendWebhookFailureAlert).not.toHaveBeenCalled()
  })

  it('returns 200 for an untagged checkout with no matching user', async () => {
    const res = await send('checkout.session.completed', { id: 'cs_x', customer: 'cus_x', mode: 'subscription' })
    expect(res.status).toBe(200)
    expect(sendWebhookFailureAlert).not.toHaveBeenCalled()
  })

  it('still alerts when our own tagged checkout has no matching user', async () => {
    const res = await send('checkout.session.completed', {
      id: 'cs_si', customer: 'cus_si', mode: 'subscription', metadata: { product: 'subscription-incinerator' },
    })
    expect(res.status).toBe(500)
    expect(sendWebhookFailureAlert).toHaveBeenCalled()
  })

  it('upgrades a known user', async () => {
    db.user.updateMany.mockResolvedValue({ count: 1 })
    const res = await send('checkout.session.completed', {
      id: 'cs_ok', customer: 'cus_ok', mode: 'subscription', metadata: { product: 'subscription-incinerator' },
    })
    expect(res.status).toBe(200)
    expect(db.user.updateMany).toHaveBeenCalledWith({ where: { stripeCustomerId: 'cus_ok' }, data: { tier: 'premium' } })
  })

  it('ignores subscription.deleted for a non-user customer', async () => {
    db.user.findUnique.mockResolvedValue(null)
    const res = await send('customer.subscription.deleted', { id: 'sub_bp', customer: 'cus_bp' })
    expect(res.status).toBe(200)
    expect(db.user.update).not.toHaveBeenCalled()
  })
})
