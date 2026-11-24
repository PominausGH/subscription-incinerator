import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { stripe } from '@/lib/stripe'
import { sendWebhookFailureAlert, sendCancellationEmail, sendPaymentFailedEmail } from '@/lib/notifications/email'
import Stripe from 'stripe'
import { clearCardFailures, customerIdOf, expireOpenSessions, recordCardFailure } from '@/lib/stripe-hardening'

const PRODUCT_SLUG = 'subscription-incinerator'

/**
 * Best-effort extraction of a customer email from a Stripe event payload,
 * without making an extra API call. Not all event types carry one.
 */
function extractCustomerEmail(event: Stripe.Event): string | null {
  const obj = event.data.object as {
    customer_details?: { email?: string | null } | null
    customer_email?: string | null
  }
  return obj?.customer_details?.email || obj?.customer_email || null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        clearCardFailures(customerIdOf(session))
        // The Stripe account is shared across products, so this endpoint also
        // receives other products' checkouts. Ignore those instead of 500ing
        // (which triggers Stripe retries and a failure-alert email per retry).
        const product = session.metadata?.product
        if (product && product !== PRODUCT_SLUG) {
          console.log(`Ignoring checkout for other product "${product}": ${session.id}`)
          break
        }
        if (session.customer && session.mode === 'subscription') {
          const { count } = await db.user.updateMany({
            where: { stripeCustomerId: session.customer as string },
            data: { tier: 'premium' },
          })
          if (count === 0) {
            // Tagged as ours but no matching user = real problem: fail so it alerts.
            if (product === PRODUCT_SLUG) {
              throw new Error(`No user for Stripe customer ${session.customer} (checkout ${session.id})`)
            }
            // Untagged and unknown: almost certainly another product's checkout.
            console.warn(`No user for untagged Stripe customer ${session.customer}; checkout ${session.id} ignored`)
          } else {
            console.log(`User upgraded to premium: ${session.customer}`)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.customer) {
          const existing = await db.user.findUnique({
            where: { stripeCustomerId: subscription.customer as string },
            select: { id: true },
          })
          if (!existing) {
            console.log(`Ignoring subscription.deleted for non-user customer: ${subscription.customer}`)
            break
          }
          const user = await db.user.update({
            where: { stripeCustomerId: subscription.customer as string },
            data: { tier: 'free' },
          })
          console.log(`User downgraded to free: ${subscription.customer}`)

          if (user.email) {
            await sendCancellationEmail({ toEmail: user.email, name: user.name ?? 'there' })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment failed for customer: ${invoice.customer}`)

        if (invoice.customer) {
          const user = await db.user.findUnique({
            where: { stripeCustomerId: invoice.customer as string },
          })
          if (user?.email) {
            await sendPaymentFailedEmail({ toEmail: user.email, name: user.name ?? 'there' })
          }
        }
        break
      }

      case 'setup_intent.setup_failed':
      case 'payment_intent.payment_failed': {
        // Card-testing guard: after repeated failed cards, kill the customer's open checkout.
        const customerId = customerIdOf(event.data.object as { customer?: string | { id?: string } | null })
        if (customerId && recordCardFailure(customerId)) {
          try {
            const n = await expireOpenSessions(stripe, customerId, PRODUCT_SLUG)
            if (n) console.warn(`[stripe-webhook] repeated card failures for ${customerId}; expired ${n} checkout session(s)`)
          } catch (err) {
            console.error('[stripe-webhook] failed to expire checkout session:', err)
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)

    await sendWebhookFailureAlert({
      eventType: event.type,
      eventId: event.id,
      error,
      customerEmail: extractCustomerEmail(event),
    })

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
