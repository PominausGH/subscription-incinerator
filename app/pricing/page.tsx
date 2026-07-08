import { Navigation } from '@/components/landing/navigation'
import { Pricing } from '@/components/landing/pricing'
import { Footer } from '@/components/landing/footer'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start free and upgrade when you\'re ready. $9/mo or $50/year.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing — Subscription Incinerator',
    description: 'Start free and upgrade when you\'re ready. $9/mo or $50/year.',
    url: '/pricing',
  },
}

export default function PricingPage() {
  return (
    <main className="bg-dark-900 min-h-screen">
      <Navigation />
      <div className="pt-16">
        <Pricing />
      </div>
      <Footer />
    </main>
  )
}
