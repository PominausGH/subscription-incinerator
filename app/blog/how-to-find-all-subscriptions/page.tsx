import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogCTA } from '@/components/blog/blog-cta'

export const metadata: Metadata = {
  title: 'How to Find Every Subscription Billing You Right Now (2026 Guide)',
  description:
    'A step-by-step guide to finding every recurring charge — in your email, bank statements, PayPal, Apple, Google, and credit cards.',
  alternates: { canonical: '/blog/how-to-find-all-subscriptions' },
  openGraph: {
    type: 'article',
    title: 'How to Find Every Subscription Billing You Right Now (2026 Guide)',
    description: 'A step-by-step guide to finding every recurring charge — email, bank, PayPal, Apple, Google, and credit cards.',
    url: '/blog/how-to-find-all-subscriptions',
  },
}

export default function HowToFindAllSubscriptions() {
  return (
    <article className="max-w-2xl mx-auto px-4 py-16">
      <header className="mb-12">
        <span className="text-fire-500 text-sm font-medium">Guides</span>
        <h1 className="text-4xl font-bold text-white mt-2 mb-4">
          How to Find Every Subscription Billing You Right Now (2026 Guide)
        </h1>
        <p className="text-gray-400">April 4, 2026 · 7 min read</p>
      </header>

      <div className="prose prose-invert max-w-none space-y-6 text-gray-300 leading-relaxed">
        <p>
          The average person pays for <strong className="text-white">4–6 subscriptions they've completely forgotten about</strong>. That's not a guess — it's what users discover when they do a proper audit. Gym memberships from last January. A VPN trial that quietly converted. A premium tier on an app you deleted.
        </p>
        <p>
          Finding them all requires checking eight different places. Most people stop after two. This guide covers all eight.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">1. Search Your Email Inbox</h2>
        <p>
          Your inbox is the single best place to start. Every subscription sends a receipt or renewal notice — and those emails don't disappear.
        </p>
        <p>
          In Gmail, use the search bar with these queries one at a time:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><code className="bg-dark-700 px-2 py-0.5 rounded text-fire-400 text-sm">receipt OR invoice OR subscription</code></li>
          <li><code className="bg-dark-700 px-2 py-0.5 rounded text-fire-400 text-sm">"your subscription" OR "billing confirmation"</code></li>
          <li><code className="bg-dark-700 px-2 py-0.5 rounded text-fire-400 text-sm">"trial ends" OR "free trial"</code></li>
          <li><code className="bg-dark-700 px-2 py-0.5 rounded text-fire-400 text-sm">"you've been charged" OR "payment received"</code></li>
        </ul>
        <p>
          Sort results by sender. Anything that appears regularly (monthly or annually) is almost certainly a subscription. Look for senders you don't recognise — those are the forgotten ones.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">2. Review Your Bank Statements</h2>
        <p>
          Log into your bank's web interface (not the app — the full transaction history is easier to review on desktop). Download or view the last 3 months of statements.
        </p>
        <p>
          What to look for:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Same amount, repeated monthly</strong> — the clearest signal</li>
          <li><strong className="text-white">Amounts ending in .99</strong> — the classic subscription pricing tell</li>
          <li><strong className="text-white">Company names you don't recognise</strong> — payment processors often show the parent company name, not the brand (e.g., "PADDLE.COM" instead of the app name)</li>
        </ul>
        <p>
          Sort by amount, then scan from top to bottom. A $14.99 charge you can't explain is worth investigating.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">3. Check Your Credit Cards Separately</h2>
        <p>
          This is a separate step from your bank account. Many people have subscriptions spread across multiple cards — a personal Visa, a work Amex, a card you use for online purchases only. Log into each card's portal individually.
        </p>
        <p>
          Pay special attention to cards you don't use day-to-day. These often have one or two forgotten auto-charges that are easy to miss in the monthly statement.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">4. Check PayPal Recurring Payments</h2>
        <p>
          PayPal has a separate section for active subscriptions that many people never look at. Here's how to find it:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Log into paypal.com</li>
          <li>Click your name → Account Settings</li>
          <li>Select "Payments" → "Manage automatic payments"</li>
        </ol>
        <p>
          This shows every merchant authorised to bill you via PayPal. Some of these will be for services you no longer use. You can cancel directly from this screen.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">5. Check Apple Subscriptions</h2>
        <p>
          Apple bundles all App Store subscriptions — including Apple One, iCloud, Apple Music, and third-party apps — in one place:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">On iPhone/iPad:</strong> Settings → [your name] → Subscriptions</li>
          <li><strong className="text-white">On Mac:</strong> App Store → [your name] → View Information → Subscriptions</li>
        </ul>
        <p>
          You'll see all active and expired subscriptions. Check the "Expired" section too — these are services you cancelled but might have re-subscribed to without realising.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">6. Check Google Play Subscriptions</h2>
        <p>
          For Android users and anyone using Google Play:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open Google Play Store</li>
          <li>Tap your profile photo → Payments & subscriptions → Subscriptions</li>
        </ol>
        <p>
          Also check: <strong className="text-white">Google One</strong> (storage), <strong className="text-white">YouTube Premium</strong>, and any apps with in-app subscriptions. These are billed through Google Play even if the app isn't a Google product.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">7. Check Amazon Memberships</h2>
        <p>
          Amazon has multiple subscription types that are easy to lose track of:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Prime membership</strong> — amazon.com/mc</li>
          <li><strong className="text-white">Subscribe & Save orders</strong> — regular product deliveries</li>
          <li><strong className="text-white">Channels</strong> (Paramount+, Starz via Prime Video) — amazon.com/channels</li>
          <li><strong className="text-white">Audible</strong> — separate account but often linked to Amazon</li>
          <li><strong className="text-white">Kindle Unlimited</strong></li>
        </ul>
        <p>
          Go to amazon.com → Account → Memberships & Subscriptions to see everything in one place.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">8. Check for Software Trials You Forgot</h2>
        <p>
          B2B and creative software often has the most aggressive trial-to-paid conversions. Check:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Adobe Creative Cloud</strong> — notorious for hard-to-cancel annual plans with early termination fees</li>
          <li><strong className="text-white">Microsoft 365</strong> — family and personal plans auto-renew annually</li>
          <li><strong className="text-white">Canva Pro, Figma, Notion</strong> — common for people to start a trial and forget</li>
          <li><strong className="text-white">VPN services</strong> — often purchased with a "first month free" deal</li>
          <li><strong className="text-white">Domain registrars</strong> — annual auto-renewals for domains you may not need</li>
        </ul>

        <h2 className="text-2xl font-bold text-white pt-4">What to Do When You Find Them</h2>
        <p>
          For each subscription you find, ask two questions:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong className="text-white">Have I used this in the last 30 days?</strong> If no, it's a candidate for cancellation.</li>
          <li><strong className="text-white">Would I sign up for this today at this price?</strong> If the honest answer is no, cancel.</li>
        </ol>
        <p>
          Don't fall for the sunk cost fallacy — the money you've already paid is gone regardless of whether you keep the subscription.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">The Faster Way</h2>
        <p>
          Running through all eight of these manually takes about an hour. Subscription Incinerator automates most of it: connect your Gmail and it scans for subscription emails automatically, surfacing anything that looks like a recurring charge for your review.
        </p>
      </div>

      <BlogCTA
        title="Stop tracking manually"
        description="Subscription Incinerator finds and tracks all of this automatically — free."
      />
    </article>
  )
}
