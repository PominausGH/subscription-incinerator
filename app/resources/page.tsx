import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { blogPosts } from '@/lib/blog/posts'
import { cancellationServices } from '@/lib/cancel/services'

export const metadata: Metadata = {
  title: 'Free Resources',
  description:
    'Free tools, guides, and checklists for finding and cancelling forgotten subscriptions.',
  alternates: { canonical: '/resources' },
  openGraph: {
    title: 'Free Resources — Subscription Incinerator',
    description: 'Free tools, guides, and checklists for finding and cancelling forgotten subscriptions.',
    url: '/resources',
  },
}

export default function ResourcesPage() {
  return (
    <div className="bg-dark-900 min-h-screen">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <header className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Free Resources</h1>
            <p className="text-gray-400 text-lg">
              Tools, guides, and checklists for managing and cancelling subscriptions.
            </p>
          </header>

          {/* Free Tools */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Free Tools</h2>
            <div className="grid gap-4">
              <Link
                href="/free-checklist"
                className="flex gap-5 bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-6 transition-all group"
              >
                <span className="text-4xl flex-shrink-0">📋</span>
                <div>
                  <p className="text-white font-bold text-lg group-hover:text-fire-400 transition-colors">
                    Subscription Audit Checklist
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    10-step checklist covering every place subscriptions hide. Sent to your inbox instantly, free.
                  </p>
                  <p className="mt-3 text-fire-500 text-sm font-medium">Get the checklist →</p>
                </div>
              </Link>
              <Link
                href="/open-source"
                className="flex gap-5 bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-6 transition-all group"
              >
                <span className="text-4xl flex-shrink-0">🌱</span>
                <div>
                  <p className="text-white font-bold text-lg group-hover:text-fire-400 transition-colors">
                    Open Source Alternatives to Paid Apps
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Free replacements for Netflix, Spotify, Notion, Adobe, Slack, ChatGPT and more. Stop paying.
                  </p>
                  <p className="mt-3 text-fire-500 text-sm font-medium">Browse alternatives →</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Blog Posts */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Guides & Articles</h2>
              <Link href="/blog" className="text-fire-500 text-sm hover:text-fire-400 transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid gap-4">
              {blogPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="flex gap-4 bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-5 transition-all group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-fire-500 text-xs font-semibold">{post.category}</span>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-gray-500 text-xs">{post.readTime}</span>
                    </div>
                    <p className="text-white font-semibold group-hover:text-fire-400 transition-colors">
                      {post.title}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">{post.description}</p>
                  </div>
                  <span className="text-fire-500 text-lg flex-shrink-0 self-center">→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Cancellation Guides */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Cancellation Guides</h2>
              <Link href="/cancel" className="text-fire-500 text-sm hover:text-fire-400 transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {cancellationServices.map((service) => (
                <Link
                  key={service.slug}
                  href={`/cancel/${service.slug}`}
                  className="flex items-center gap-3 bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl px-4 py-3 transition-all group"
                >
                  <span className="text-2xl">{service.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium group-hover:text-fire-400 transition-colors">
                      Cancel {service.name}
                    </p>
                    <p className="text-gray-500 text-xs">{service.monthlyPrice}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      service.difficulty === 'Easy'
                        ? 'text-green-400 bg-green-400/10'
                        : service.difficulty === 'Medium'
                        ? 'text-yellow-400 bg-yellow-400/10'
                        : 'text-red-400 bg-red-400/10'
                    }`}
                  >
                    {service.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="p-8 bg-dark-800 border border-fire-500/30 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Track everything in one place
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Subscription Incinerator automatically finds and tracks your recurring charges — free.
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
