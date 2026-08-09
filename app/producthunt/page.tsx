import type { Metadata } from 'next'
import {
  Navigation,
  ProductHuntHero,
  PainPoints,
  Solution,
  Features,
  TrustBar,
  HowItWorks,
  Pricing,
  FAQ,
  Testimonials,
  FinalCTA,
  Footer,
} from '@/components/landing'

export const metadata: Metadata = {
  title: 'Subscription Incinerator — Product Hunt Launch',
  description: 'Track and cancel forgotten subscriptions. Product Hunt readers get 1 month free of Premium instead of the usual 7-day trial.',
  robots: { index: false, follow: true },
}

export default function ProductHuntPage() {
  return (
    <main className="bg-dark-900">
      <Navigation />
      <ProductHuntHero />
      <PainPoints />
      <Solution />
      <Features />
      <TrustBar />
      <HowItWorks />
      <Pricing source="producthunt" />
      <FAQ />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}
