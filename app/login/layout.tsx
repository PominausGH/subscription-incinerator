import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Subscription Incinerator to track and cancel your forgotten subscriptions.',
  alternates: { canonical: '/login' },
  openGraph: {
    title: 'Sign in to Subscription Incinerator',
    description: 'Sign in to track and cancel your forgotten subscriptions.',
    url: '/login',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
