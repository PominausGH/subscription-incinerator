import type { Metadata } from 'next'
import { getCompetitorAlternative } from '@/lib/alternatives/competitors'
import { CompetitorAlternativePage } from '@/components/alternatives/competitor-alternative-page'

const data = getCompetitorAlternative('mint')!

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  alternates: { canonical: '/mint-alternative' },
  openGraph: {
    title: data.metaTitle,
    description: data.metaDescription,
    url: '/mint-alternative',
  },
}

export default function MintAlternativePage() {
  return <CompetitorAlternativePage data={data} />
}
