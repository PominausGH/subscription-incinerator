import type Stripe from 'stripe'

/**
 * Anti card-testing guard for Stripe Checkout (same approach as EveryRing / BrightPath).
 *
 * - Force 3DS on every card: stolen cards fail without the cardholder's device, and fraud
 *   disputes on 3DS-authenticated payments shift liability to the issuer.
 * - Require a billing address so Radar's postcode check has data.
 * - 31-min sessions (Stripe minimum is 30) instead of 24h of unlimited card attempts.
 * - After MAX_CARD_FAILURES failed cards for one Stripe customer within FAILURE_WINDOW_MS,
 *   expire that customer's open Checkout sessions for this product.
 *
 * Keyed by customer, not intent: subscription-mode sessions aren't reliably linked to their
 * SetupIntent/PaymentIntent until they complete. Needs the webhook endpoint subscribed to
 * setup_intent.setup_failed and payment_intent.payment_failed.
 *
 * Why: the only fraud chargeback on the shared Stripe account (Aug 2026, lost, A$37.56) came
 * through this app's 7-day trial.
 */
export const MAX_CARD_FAILURES = 2
export const FAILURE_WINDOW_MS = 60 * 60 * 1000
export const SESSION_TTL_SECONDS = 31 * 60
const MAX_TRACKED = 5000

// Best-effort in-process counter (single container). A restart resets it, which only gives
// an attacker a few more tries; the session TTL still bounds them.
const failures = new Map<string, { count: number; firstAt: number }>()

export function checkoutHardeningParams(
  nowSeconds: number = Math.floor(Date.now() / 1000)
): Pick<Stripe.Checkout.SessionCreateParams, 'payment_method_options' | 'billing_address_collection' | 'expires_at'> {
  return {
    payment_method_options: { card: { request_three_d_secure: 'any' } },
    billing_address_collection: 'required',
    expires_at: nowSeconds + SESSION_TTL_SECONDS,
  }
}

/** Records a failed card for a customer; returns true once the limit is reached. */
export function recordCardFailure(customerId: string | null | undefined, nowMs: number = Date.now()): boolean {
  if (!customerId) return false
  const prev = failures.get(customerId)
  const entry =
    prev && nowMs - prev.firstAt < FAILURE_WINDOW_MS
      ? { count: prev.count + 1, firstAt: prev.firstAt }
      : { count: 1, firstAt: nowMs }
  failures.delete(customerId) // re-insert so Map order stays oldest-first
  failures.set(customerId, entry)
  if (failures.size > MAX_TRACKED) {
    const oldest = failures.keys().next().value
    if (oldest) failures.delete(oldest)
  }
  return entry.count >= MAX_CARD_FAILURES
}

export function clearCardFailures(customerId: string | null | undefined): void {
  if (customerId) failures.delete(customerId)
}

/** Expires the customer's open Checkout sessions for this product only (shared account). */
export async function expireOpenSessions(stripe: Stripe, customerId: string, productSlug: string): Promise<number> {
  const sessions = await stripe.checkout.sessions.list({ customer: customerId, status: 'open', limit: 10 })
  let expired = 0
  for (const session of sessions.data) {
    if (session.metadata?.product === productSlug) {
      await stripe.checkout.sessions.expire(session.id)
      expired++
    }
  }
  return expired
}

export function customerIdOf(obj: { customer?: string | { id?: string } | null } | null | undefined): string | null {
  if (!obj?.customer) return null
  return typeof obj.customer === 'string' ? obj.customer : obj.customer.id ?? null
}

/** Test hook. */
export const _failures = failures
