'use client'

import Script from 'next/script'

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Subscription Incinerator",
  "description": "Track, manage, and cancel unwanted subscriptions to save money",
  "url": "https://subscriptionincinerator.com",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "featureList": [
    "Automatic subscription detection from email",
    "Bank transaction analysis",
    "Trial reminder notifications",
    "One-click cancellation links",
    "Spending analytics and reports"
  ],
  "author": {
    "@type": "Organization",
    "name": "Subscription Incinerator",
    "url": "https://subscriptionincinerator.com"
  }
}

export function JsonLd() {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
