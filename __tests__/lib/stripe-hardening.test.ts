/**
 * @jest-environment node
 */
import {
  checkoutHardeningParams,
  recordCardFailure,
  clearCardFailures,
  expireOpenSessions,
  customerIdOf,
  FAILURE_WINDOW_MS,
  _failures,
} from '@/lib/stripe-hardening'
import type Stripe from 'stripe'

beforeEach(() => _failures.clear())

describe('checkoutHardeningParams', () => {
  it('forces 3DS, requires billing address and expires in 31 min', () => {
    expect(checkoutHardeningParams(1000)).toEqual({
      payment_method_options: { card: { request_three_d_secure: 'any' } },
      billing_address_collection: 'required',
      expires_at: 1000 + 31 * 60,
    })
  })
})

describe('recordCardFailure', () => {
  it('allows the first failure and trips on the second', () => {
    expect(recordCardFailure('cus_a', 0)).toBe(false)
    expect(recordCardFailure('cus_a', 1000)).toBe(true)
  })
  it('counts per customer', () => {
    expect(recordCardFailure('cus_a', 0)).toBe(false)
    expect(recordCardFailure('cus_b', 0)).toBe(false)
  })
  it('starts a fresh count outside the window', () => {
    expect(recordCardFailure('cus_a', 0)).toBe(false)
    expect(recordCardFailure('cus_a', FAILURE_WINDOW_MS + 1)).toBe(false)
  })
  it('resets after clearing', () => {
    recordCardFailure('cus_a', 0)
    clearCardFailures('cus_a')
    expect(recordCardFailure('cus_a', 1)).toBe(false)
  })
  it('ignores a missing customer', () => {
    expect(recordCardFailure(null)).toBe(false)
    expect(recordCardFailure(undefined)).toBe(false)
  })
})

describe('customerIdOf', () => {
  it('handles string, expanded and missing customers', () => {
    expect(customerIdOf({ customer: 'cus_x' })).toBe('cus_x')
    expect(customerIdOf({ customer: { id: 'cus_y' } })).toBe('cus_y')
    expect(customerIdOf({ customer: null })).toBeNull()
  })
})

describe('expireOpenSessions', () => {
  it("expires only this product's open sessions (shared Stripe account)", async () => {
    const expire = jest.fn()
    const stripe = {
      checkout: {
        sessions: {
          list: jest.fn(async () => ({
            data: [
              { id: 'cs_si', metadata: { product: 'subscription-incinerator' } },
              { id: 'cs_other', metadata: { product: 'brightpath' } },
              { id: 'cs_none', metadata: {} },
            ],
          })),
          expire,
        },
      },
    } as unknown as Stripe
    await expect(expireOpenSessions(stripe, 'cus_a', 'subscription-incinerator')).resolves.toBe(1)
    expect(stripe.checkout.sessions.list).toHaveBeenCalledWith({ customer: 'cus_a', status: 'open', limit: 10 })
    expect(expire).toHaveBeenCalledTimes(1)
    expect(expire).toHaveBeenCalledWith('cs_si')
  })
})
