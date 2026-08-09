import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'What Is a Zombie Subscription? How to Find and Kill Them',
  description:
    'A zombie subscription is one you forgot about but are still paying for. Here’s how to spot them and how Subscription Incinerator finds yours automatically.',
  alternates: { canonical: '/zombie-subscriptions' },
  openGraph: {
    title: 'What Is a Zombie Subscription? — Subscription Incinerator',
    description: 'A zombie subscription is one you forgot about but are still paying for. Here’s how to find and kill yours.',
    url: '/zombie-subscriptions',
  },
}

const signs = [
  'You couldn\'t say from memory what it costs or when it renews',
  'You haven\'t opened the app or used the service in over a month',
  'It renewed automatically after a free trial you meant to cancel',
  'It\'s billed annually, so a year of silence doesn\'t feel like anything is wrong',
  'It\'s on a card you don\'t check often, or split across a shared family plan',
]

const faq = [
  {
    q: 'What exactly counts as a zombie subscription?',
    a: 'Any recurring charge that keeps billing you after you\'ve stopped getting value from it — a trial you forgot to cancel, an app you stopped opening, a plan you upgraded away from without cancelling the old one.',
  },
  {
    q: 'How does Subscription Incinerator find zombie subscriptions?',
    a: 'We scan Gmail receipts (read-only) to build a full list of what\'s billing you, then track spend by category so anything sitting untouched is easy to spot. When you cancel one, we record the savings so you can see exactly what killing zombie subscriptions is worth.',
  },
  {
    q: 'Do I need to link my bank account to find zombie subscriptions?',
    a: 'No — Gmail scanning and manual tracking both work without a linked bank account. Bank CSV import is available too, but optional.',
  },
]

export default function ZombieSubscriptionsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <div className="bg-dark-900 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">🧟</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              What Is a Zombie Subscription?
            </h1>
            <p className="text-gray-400 text-lg">
              A subscription is "zombie" the moment you stop getting value from it but the
              charge keeps coming back from the dead every month anyway.
            </p>
          </div>

          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-10 text-center">
            <p className="text-gray-400 text-sm">
              💸 The average person wastes{' '}
              <span className="text-fire-400 font-semibold">$273/year</span> on subscriptions
              like this — charges nobody's actively using.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Signs you're carrying one</h2>
            <ul className="space-y-3">
              {signs.map((sign, i) => (
                <li
                  key={i}
                  className="flex gap-3 bg-dark-800 border border-dark-600 rounded-xl p-4 text-sm text-gray-300"
                >
                  <span className="text-fire-500 flex-shrink-0">🧟</span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">
              How Subscription Incinerator finds them
            </h2>
            <div className="grid gap-4">
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                <p className="text-white font-semibold text-sm mb-1">Full inventory first</p>
                <p className="text-gray-400 text-sm">
                  We scan Gmail receipts (read-only) to build a complete list of what's
                  actually billing you — including ones you forgot existed.
                </p>
              </div>
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                <p className="text-white font-semibold text-sm mb-1">Spend by category</p>
                <p className="text-gray-400 text-sm">
                  Seeing everything grouped together makes it obvious which charges aren't
                  earning their place.
                </p>
              </div>
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                <p className="text-white font-semibold text-sm mb-1">Savings on every cancel</p>
                <p className="text-gray-400 text-sm">
                  Cancel a zombie subscription through our guided flow and we record exactly
                  what you saved — proof it was worth killing.
                </p>
              </div>
            </div>
          </section>

          <div className="p-6 bg-dark-700 rounded-xl border border-fire-500/30 text-center mb-12">
            <p className="text-white font-semibold mb-2">Find your zombie subscriptions free</p>
            <p className="text-gray-400 text-sm mb-4">
              Track up to 10 subscriptions manually at no cost, or connect Gmail on Premium to
              find them automatically.
            </p>
            <Link
              href="/login"
              className="inline-flex px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors"
            >
              Start Free →
            </Link>
          </div>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">Questions</h2>
            <div className="space-y-4">
              {faq.map((item) => (
                <div key={item.q}>
                  <p className="text-white font-medium text-sm mb-1">{item.q}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
