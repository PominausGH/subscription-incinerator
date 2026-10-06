import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

const PRODUCT_SLUG = 'subscription-incinerator'
const PRODUCT_DISPLAY_NAME = 'Subscription Incinerator'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const annual = body.annual === true
    const trialDays = body.source === 'producthunt' ? 30 : 7

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, stripeCustomerId: true, tier: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.tier === 'premium') {
      return NextResponse.json(
        { error: 'Already subscribed to premium' },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const priceId = annual
      ? process.env.STRIPE_PRICE_ID_ANNUAL
      : process.env.STRIPE_PRICE_ID_MONTHLY

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
    }

    // Create checkout session
    // Subscription mode: payment_intent_data (and so statement_descriptor_suffix) is not
    // allowed. Stripe derives subscription charge descriptors from the Invoice/Product,
    // so no per-session descriptor is set here.
    const params: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: { product: PRODUCT_SLUG },
      subscription_data: {
        trial_period_days: trialDays,
        metadata: { product: PRODUCT_SLUG },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    }

    let checkoutSession
    try {
      checkoutSession = await stripe.checkout.sessions.create({
        ...params,
        branding_settings: { display_name: PRODUCT_DISPLAY_NAME },
      } as Stripe.Checkout.SessionCreateParams)
    } catch (err) {
      const e = err as { type?: string; param?: string; message?: string }
      if (e?.type === 'StripeInvalidRequestError' && /branding_settings/.test(`${e.param ?? ''} ${e.message ?? ''}`)) {
        console.warn('Stripe rejected branding_settings; retrying without it:', e.message)
        checkoutSession = await stripe.checkout.sessions.create(params)
      } else {
        throw err
      }
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
