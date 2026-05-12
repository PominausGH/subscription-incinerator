import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Subscription Incinerator team — questions, feedback, or support requests welcome.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Subscription Incinerator',
    description: 'Get in touch — questions, feedback, or support requests welcome.',
    url: '/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
