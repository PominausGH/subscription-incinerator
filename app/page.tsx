import {
  Navigation,
  Hero,
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

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Subscription Incinerator",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": [
    { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
    { "@type": "Offer", "price": "9", "priceCurrency": "USD", "name": "Premium", "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" } }
  ],
  "description": "Track and cancel forgotten subscriptions. Automatically finds trials and recurring charges, then reminds you before you get charged.",
  "url": "https://subscriptionincinerator.app"
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is it really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The core features are completely free — track subscriptions, get reminders, and manage your spending at no cost. We also offer an optional premium tier with advanced features like Gmail scanning and bank statement import.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data safe?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "We only request read-only access to your Gmail - we can't send emails or modify anything. Your bank statements are processed locally and we only store the subscription data you approve. We never sell your data.",
      },
    },
    {
      '@type': 'Question',
      name: 'What if you miss a subscription?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No detection is perfect. You can always add subscriptions manually, and our pending review system lets you approve or dismiss anything we find. You're always in control.",
      },
    },
    {
      '@type': 'Question',
      name: 'Which email providers do you support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Currently Gmail only. Outlook and other providers are on our roadmap.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can you cancel subscriptions for me?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not yet - we provide step-by-step instructions to help you cancel yourself. Automated cancellation is coming in a future update.',
      },
    },
  ],
}

export default function Home() {
  return (
    <main className="bg-dark-900">
      <script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navigation />
      <Hero />
      <PainPoints />
      <Solution />
      <Features />
      <TrustBar />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}
