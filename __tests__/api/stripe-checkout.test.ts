/**
 * @jest-environment node
 */
const create = jest.fn()

jest.mock('@/lib/auth', () => ({ auth: jest.fn(async () => ({ user: { id: 'u1' } })) }))
jest.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(async () => ({ id: 'u1', email: 'a@b.c', stripeCustomerId: 'cus_1', tier: 'free' })),
      update: jest.fn(),
    },
  },
}))
jest.mock('@/lib/stripe', () => ({
  stripe: { customers: { create: jest.fn() }, checkout: { sessions: { create: (...a: unknown[]) => create(...a) } } },
}))

import { POST } from '@/app/api/stripe/checkout/route'

const req = () => new Request('http://x/api/stripe/checkout', { method: 'POST', body: '{}' })

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    create.mockReset()
    process.env.STRIPE_PRICE_ID_MONTHLY = 'price_m'
  })

  it('sets product metadata and branding display name', async () => {
    create.mockResolvedValue({ url: 'https://stripe/x' })
    const res = await POST(req())
    expect((await res.json()).url).toBe('https://stripe/x')
    const arg = create.mock.calls[0][0]
    expect(arg.metadata).toEqual({ product: 'subscription-incinerator' })
    expect(arg.subscription_data.metadata).toEqual({ product: 'subscription-incinerator' })
    expect(arg.branding_settings).toEqual({ display_name: 'Subscription Incinerator' })
    expect(arg.payment_intent_data).toBeUndefined()
  })

  it('retries without branding_settings when Stripe rejects it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    create
      .mockRejectedValueOnce(Object.assign(new Error('Received unknown parameter: branding_settings'), { type: 'StripeInvalidRequestError', param: 'branding_settings' }))
      .mockResolvedValueOnce({ url: 'https://stripe/y' })
    const res = await POST(req())
    expect((await res.json()).url).toBe('https://stripe/y')
    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[1][0].branding_settings).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
