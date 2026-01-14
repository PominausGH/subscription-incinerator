/**
 * @jest-environment node
 */
import { stripe } from '@/lib/stripe'

describe('Stripe Client', () => {
  it('should export a configured stripe instance', () => {
    expect(stripe).toBeDefined()
    expect(typeof stripe.customers).toBe('object')
    expect(typeof stripe.checkout).toBe('object')
  })
})
