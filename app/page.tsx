import {
  Navigation,
  Hero,
  PainPoints,
  Solution,
  Features,
  HowItWorks,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing'

export default function Home() {
  return (
    <main className="bg-dark-900">
      <Navigation />
      <Hero />
      <PainPoints />
      <Solution />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}
