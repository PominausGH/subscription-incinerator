import type { Metadata } from 'next'
import { getCompetitorAlternative } from '@/lib/alternatives/competitors'
import { CompetitorAlternativePage } from '@/components/alternatives/competitor-alternative-page'

const data = getCompetitorAlternative('rocket-money')!

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  alternates: { canonical: '/rocket-money-alternative' },
  openGraph: {
    title: data.metaTitle,
    description: data.metaDescription,
    url: '/rocket-money-alternative',
  },
}

export default function RocketMoneyAlternativePage() {
  return <CompetitorAlternativePage data={data} />
}
