import { Navigation } from '@/components/landing/navigation'
import { Pricing } from '@/components/landing/pricing'
import { Footer } from '@/components/landing/footer'

export const metadata = {
  title: 'Pricing — Subscription Incinerator',
  description: 'Start free and upgrade when you\'re ready. $9/mo or $79/year.',
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
