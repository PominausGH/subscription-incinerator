import type { Metadata } from 'next'
import Link from 'next/link'
import { cancellationServices } from '@/lib/cancel/services'

export const metadata: Metadata = {
  title: 'How to Cancel Any Subscription — Step-by-Step Guides',
  description:
    'Free step-by-step cancellation guides for Netflix, Spotify, Adobe, Amazon Prime, and more. No phone calls required.',
  alternates: { canonical: '/cancel' },
  openGraph: {
    title: 'How to Cancel Any Subscription — Step-by-Step Guides',
    description: 'Free step-by-step cancellation guides for Netflix, Spotify, Adobe, and more.',
    url: '/cancel',
  },
}

const difficultyColor = {
  Easy: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  Hard: 'text-red-400 bg-red-400/10',
}

export default function CancelDirectoryPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          How to Cancel Any Subscription
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Step-by-step cancellation guides for the most common subscriptions. No phone calls,
          no chat bots — just the exact steps.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cancellationServices.map((service) => (
          <Link
            key={service.slug}
            href={`/cancel/${service.slug}`}
            className="block bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-5 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{service.logo}</span>
              <div>
                <p className="text-white font-semibold group-hover:text-fire-400 transition-colors">
                  {service.name}
                </p>
                <p className="text-gray-500 text-xs">{service.monthlyPrice}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor[service.difficulty]}`}
              >
                {service.difficulty} to cancel
              </span>
              <span className="text-fire-500 text-sm">Guide →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 p-8 bg-dark-800 border border-fire-500/30 rounded-xl text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Find subscriptions you forgot about
        </h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Before you can cancel them, you need to find them. Subscription Incinerator scans your
          Gmail and bank imports to surface every recurring charge automatically — free.
        </p>
        <Link
          href="/login"
          className="inline-flex px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors"
        >
          Find My Subscriptions →
        </Link>
      </div>
    </main>
  )
}
