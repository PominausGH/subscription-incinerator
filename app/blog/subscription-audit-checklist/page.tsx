import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogCTA } from '@/components/blog/blog-cta'

export const metadata: Metadata = {
  title: 'The Subscription Audit: A 10-Minute Checklist to Find Hidden Charges',
  description:
    "Run through this checklist once a quarter and you'll never be surprised by a subscription charge again.",
  alternates: { canonical: '/blog/subscription-audit-checklist' },
  openGraph: {
    type: 'article',
    title: 'The Subscription Audit: A 10-Minute Checklist to Find Hidden Charges',
    description: "Run this checklist once a quarter and you'll never be surprised by a subscription charge again.",
    url: '/blog/subscription-audit-checklist',
  },
}

export default function SubscriptionAuditChecklist() {
  return (
    <article className="max-w-2xl mx-auto px-4 py-16">
      <header className="mb-12">
        <span className="text-fire-500 text-sm font-medium">Guides</span>
        <h1 className="text-4xl font-bold text-white mt-2 mb-4">
          The Subscription Audit: A 10-Minute Checklist to Find Hidden Charges
        </h1>
        <p className="text-gray-400">April 4, 2026 · 4 min read</p>
      </header>

      <div className="prose prose-invert max-w-none space-y-6 text-gray-300 leading-relaxed">
        <p>
          Most subscription audits fail because people start, get distracted, and never finish. This checklist is designed to be completed in one sitting — about 10 minutes if you move through it without stopping.
        </p>
        <p>
          Do this once a quarter. Put it in your calendar. The average user who does a full audit saves over $200/year.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">The 10-Step Audit</h2>

        <div className="space-y-5">
          {[
            {
              step: 1,
              title: 'Gmail / Email Inbox',
              desc: 'Search for: receipt, invoice, subscription, "billing confirmation". Look for anything recurring. Flag anything you don\'t recognise.',
            },
            {
              step: 2,
              title: 'Primary bank account',
              desc: 'Download last 3 months. Sort by amount. Mark every recurring charge. Cross off the ones you recognise and want to keep.',
            },
            {
              step: 3,
              title: 'Credit card #1',
              desc: 'Same process. Different cards often have different subscriptions — especially if you use one card for online purchases.',
            },
            {
              step: 4,
              title: 'Credit card #2 (if applicable)',
              desc: 'Repeat. Include any store cards or business cards.',
            },
            {
              step: 5,
              title: 'PayPal recurring payments',
              desc: 'paypal.com → Account Settings → Payments → Manage automatic payments. Cancel anything you no longer use.',
            },
            {
              step: 6,
              title: 'Apple subscriptions',
              desc: 'Settings → [your name] → Subscriptions. Check both active and expired. Active = currently billing you.',
            },
            {
              step: 7,
              title: 'Google Play subscriptions',
              desc: 'Play Store → profile photo → Payments & subscriptions → Subscriptions.',
            },
            {
              step: 8,
              title: 'Amazon memberships',
              desc: 'amazon.com → Account → Memberships & Subscriptions. Check Prime, Channels, Subscribe & Save, Audible, Kindle Unlimited separately.',
            },
            {
              step: 9,
              title: 'Software / SaaS tools',
              desc: 'Adobe, Microsoft 365, Canva, Figma, Notion, Dropbox, 1Password, VPNs. Open each app you use and check the billing section.',
            },
            {
              step: 10,
              title: 'Domain and hosting registrars',
              desc: 'Namecheap, GoDaddy, Cloudflare, Hover — annual auto-renewals for domains you may no longer need.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 bg-dark-800 border border-dark-600 rounded-xl p-4">
              <div className="w-8 h-8 bg-fire-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-fire-400 font-bold text-sm">{step}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{title}</p>
                <p className="text-gray-400 text-sm mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-white pt-4">How to Decide: Keep or Cancel?</h2>
        <p>
          For every subscription you find, apply this two-question test:
        </p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong className="text-white">Have I used this in the last 30 days?</strong> If no, put it on the cancel list. The only exception is annual subscriptions that pay for something you'll use in bursts (e.g., a seasonal streaming service).
          </li>
          <li>
            <strong className="text-white">Would I sign up for this today, at this price?</strong> Ignore what you've already paid. If the honest answer is no, cancel. Sunk costs don't justify ongoing costs.
          </li>
        </ol>

        <h2 className="text-2xl font-bold text-white pt-4">The One-Month Rule</h2>
        <p>
          If you're unsure about a subscription — you use it occasionally but aren't sure it's worth the cost — apply the one-month rule: cancel it. If you genuinely miss it within 30 days, resubscribe. You'll lose at most one month of access. In practice, most people who cancel under the one-month rule never resubscribe.
        </p>
        <p>
          The psychology here matters: we dramatically overestimate how much we'll use something we're currently paying for. Once the payment stops, you quickly learn whether the service was actually valuable.
        </p>

        <h2 className="text-2xl font-bold text-white pt-4">What to Do After the Audit</h2>
        <p>
          Once you've identified subscriptions to cancel, do it immediately — don't make a note to cancel later. Later rarely comes. Go straight to the cancellation page.
        </p>
        <p>
          For everything you keep: add it to a tracker so you can see your total monthly spending in one place. The goal isn't to cancel everything — it's to know exactly what you're paying for.
        </p>
        <p>
          Set a reminder to repeat this audit in 3 months. New subscriptions accumulate faster than you'd expect.
        </p>
      </div>

      <BlogCTA
        title="Automate your next audit"
        description="Subscription Incinerator scans your Gmail and bank imports to find recurring charges automatically — free."
      />
    </article>
  )
}
