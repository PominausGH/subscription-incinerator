import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { alternativeCategories } from '@/lib/open-source/alternatives'

export const metadata: Metadata = {
  title: 'Open Source Alternatives to Paid Apps',
  description:
    'Free, open-source replacements for Netflix, Spotify, Notion, Adobe, Slack, ChatGPT and more. Stop paying for subscriptions.',
  alternates: { canonical: '/open-source' },
  openGraph: {
    title: 'Open Source Alternatives to Paid Apps — Subscription Incinerator',
    description: 'Free, open-source replacements for Netflix, Spotify, Notion, Adobe, Slack, ChatGPT and more.',
    url: '/open-source',
  },
}

function formatStars(stars: number): string {
  if (stars >= 1000) return `${(stars / 1000).toFixed(stars >= 10000 ? 0 : 1)}k`
  return stars.toString()
}

export default function OpenSourcePage() {
  const totalAlternatives = alternativeCategories.reduce((n, c) => n + c.alternatives.length, 0)

  return (
    <div className="bg-dark-900 min-h-screen">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <header className="text-center mb-14">
            <p className="text-fire-500 text-sm font-semibold uppercase tracking-wide mb-3">
              Free alternatives
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Open Source Alternatives to Paid Apps
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {totalAlternatives}+ free, community-built tools that replace popular paid subscriptions.
              Many can be self-hosted on a $5/month VPS — or run free on your own machine.
            </p>
          </header>

          {/* Category jump-nav */}
          <nav className="flex flex-wrap justify-center gap-2 mb-14">
            {alternativeCategories.map(cat => (
              <a
                key={cat.slug}
                href={`#${cat.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-full text-gray-300 hover:text-fire-400 text-sm transition-all"
              >
                <span>{cat.emoji}</span>
                {cat.category}
              </a>
            ))}
          </nav>

          {/* Categories */}
          <div className="space-y-16">
            {alternativeCategories.map(cat => (
              <section key={cat.slug} id={cat.slug} className="scroll-mt-24">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl">{cat.emoji}</span>
                    {cat.category}
                  </h2>
                  <p className="text-gray-500 text-sm mt-2">
                    Replaces:{' '}
                    <span className="text-gray-400">
                      {cat.paidServices.join(', ')}
                    </span>
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {cat.alternatives.map(alt => (
                    <article
                      key={alt.name}
                      className="bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-5 transition-all flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-bold text-lg">{alt.name}</h3>
                        {alt.stars > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-400 flex-shrink-0">
                            <span>★</span>
                            {formatStars(alt.stars)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {alt.license}
                        </span>
                        {alt.selfHosted && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Self-hostable
                          </span>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm flex-1">{alt.description}</p>

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dark-700">
                        <a
                          href={alt.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-fire-500 hover:text-fire-400 text-sm font-medium transition-colors"
                        >
                          Website →
                        </a>
                        <a
                          href={alt.sourceCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                        >
                          Source code
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-20 p-8 bg-dark-800 border border-fire-500/30 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Already paying for the apps above?
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Track your subscriptions, get reminded before each renewal, and switch to free
              alternatives at your own pace.
            </p>
            <Link
              href="/login"
              className="inline-flex px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors"
            >
              Start Free →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
