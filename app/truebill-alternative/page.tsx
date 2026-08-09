import type { Metadata } from 'next'
import { getCompetitorAlternative } from '@/lib/alternatives/competitors'
import { CompetitorAlternativePage } from '@/components/alternatives/competitor-alternative-page'

const data = getCompetitorAlternative('truebill')!

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  alternates: { canonical: '/truebill-alternative' },
  openGraph: {
    title: data.metaTitle,
    description: data.metaDescription,
    url: '/truebill-alternative',
  },
}

export default function TruebillAlternativePage() {
  return <CompetitorAlternativePage data={data} />
}
