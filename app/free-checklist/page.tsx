import type { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { FreeChecklistForm } from './form'

export const metadata: Metadata = {
  title: 'Free Subscription Audit Checklist',
  description:
    '10 places hidden subscriptions are quietly billing you — check them off one by one. Get the free checklist sent to your inbox.',
  alternates: { canonical: '/free-checklist' },
  openGraph: {
    title: 'Free Subscription Audit Checklist — Subscription Incinerator',
    description: '10 places hidden subscriptions are quietly billing you — get the free checklist.',
    url: '/free-checklist',
  },
}

export default function FreeChecklistPage() {
  return (
    <div className="bg-dark-900 min-h-screen">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">📋</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Get the Free Subscription Audit Checklist
            </h1>
            <p className="text-gray-400 text-lg">
              10 places hidden subscriptions are quietly billing you — check them off one by one.
            </p>
          </div>

          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 mb-8">
            <h2 className="text-white font-bold text-lg mb-4">What&apos;s inside:</h2>
            <ul className="space-y-3">
              {[
                'The exact Gmail search terms to find every receipt and subscription email',
                'How to check PayPal, Apple, and Google Play recurring payments',
                'Where Amazon hides auto-renewing charges',
                'A simple keep-or-cancel decision framework',
                'The one-month rule for subscriptions you\'re not sure about',
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-300">
                  <span className="text-fire-400 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <FreeChecklistForm />

          <p className="text-center text-gray-600 text-xs mt-4">
            No spam. This is the only email we&apos;ll send.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
