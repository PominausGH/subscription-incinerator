import {
  Navigation,
  Hero,
  PainPoints,
  Solution,
  Features,
  HowItWorks,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing'
import { JsonLd } from '@/components/seo/json-ld'

export default function Home() {
  return (
    <>
      <JsonLd />
      <main className="bg-dark-900">
      <Navigation />
      <Hero />
      <PainPoints />
      <Solution />
      <Features />
      <HowItWorks />
      <FAQ />
      <FinalCTA />
      <Footer />
      </main>
    </>
  )
}
