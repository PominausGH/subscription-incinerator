import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

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
        if (session.customer && session.mode === 'subscription') {
          await db.user.update({
            where: { stripeCustomerId: session.customer as string },
            data: { tier: 'premium' },
          })
          console.log(`User upgraded to premium: ${session.customer}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.customer) {
          await db.user.update({
            where: { stripeCustomerId: subscription.customer as string },
            data: { tier: 'free' },
          })
          console.log(`User downgraded to free: ${subscription.customer}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment failed for customer: ${invoice.customer}`)
        // Could send email notification here
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
