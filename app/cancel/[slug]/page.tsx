import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cancellationServices } from '@/lib/cancel/services'
import { findAlternativesForService } from '@/lib/open-source/alternatives'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return cancellationServices.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = cancellationServices.find((s) => s.slug === slug)
  if (!service) return {}
  const title = `How to Cancel ${service.name} — Step-by-Step Guide`
  const description = `Cancel your ${service.name} subscription in ${service.steps.length} steps. ${service.difficultyReason}`
  const path = `/cancel/${slug}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title,
      description,
      url: path,
    },
  }
}

const difficultyColor = {
  Easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export default async function CancelServicePage({ params }: Props) {
  const { slug } = await params
  const service = cancellationServices.find((s) => s.slug === slug)
  if (!service) notFound()

  const related = cancellationServices
    .filter((s) => s.slug !== slug)
    .slice(0, 3)
  const ossCategory = findAlternativesForService(service.name)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Cancel ${service.name}`,
    description: service.difficultyReason,
    step: service.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text: step,
    })),
    totalTime: 'PT2M',
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-500">
        <Link href="/cancel" className="hover:text-fire-400 transition-colors">
          Cancellation Guides
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-300">{service.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{service.logo}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">How to Cancel {service.name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {service.monthlyPrice} · {service.annualCost} annually
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full border ${difficultyColor[service.difficulty]}`}
          >
            {service.difficulty} to cancel
          </span>
          <p className="text-gray-400 text-sm">{service.difficultyReason}</p>
        </div>
      </header>

      {/* Why people forget */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 mb-8 text-sm text-gray-400">
        <span className="text-gray-300 font-medium">Why people forget: </span>
        {service.whyPeopleForgot}
      </div>

      {/* Direct cancel link */}
      {service.directCancelUrl && (
        <div className="mb-8">
          <a
            href={service.directCancelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors text-sm"
            data-tracking-action="direct_cancel_click"
            data-tracking-label={service.name}
          >
            Go directly to {service.name} cancel page →
          </a>
        </div>
      )}

      {/* Steps */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Step-by-step guide</h2>
        <ol className="space-y-3">
          {service.steps.map((step, i) => (
            <li key={i} className="flex gap-4 bg-dark-800 border border-dark-600 rounded-xl p-4">
              <div className="w-7 h-7 bg-fire-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-fire-400 font-bold text-xs">{i + 1}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Warnings */}
      {service.warnings.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Watch out for</h2>
          <ul className="space-y-2">
            {service.warnings.map((warning, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-400">
                <span className="text-yellow-400 flex-shrink-0 mt-0.5">⚠️</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Alternatives */}
      {service.alternatives && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3">Free alternatives</h2>
          <p className="text-gray-400 text-sm">{service.alternatives}</p>
        </section>
      )}

      {/* Open source alternatives */}
      {ossCategory && ossCategory.alternatives.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <h2 className="text-xl font-bold text-white">
              <span className="mr-2">🌱</span>Open source alternatives
            </h2>
            <Link
              href="/open-source"
              className="text-fire-500 hover:text-fire-400 text-sm font-medium transition-colors"
            >
              See all →
            </Link>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Free, community-built tools that replace {service.name}. Many are self-hostable on a cheap VPS.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ossCategory.alternatives.slice(0, 4).map((alt) => (
              <a
                key={alt.name}
                href={alt.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-white font-semibold">{alt.name}</span>
                  <span className="text-emerald-400 text-xs">{alt.license}</span>
                </div>
                <p className="text-gray-400 text-xs">{alt.description}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="p-6 bg-dark-700 rounded-xl border border-fire-500/30 text-center mb-12">
        <p className="text-white font-semibold mb-2">
          Track {service.name} so you never forget again
        </p>
        <p className="text-gray-400 text-sm mb-4">
          Add it to Subscription Incinerator and get reminded before each renewal — free.
        </p>
        <Link
          href="/login"
          className="inline-flex px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors"
        >
          Start Free →
        </Link>
      </div>

      {/* Related guides */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">More cancellation guides</h2>
        <div className="grid gap-3">
          {related.map((s) => (
            <Link
              key={s.slug}
              href={`/cancel/${s.slug}`}
              className="flex items-center gap-3 bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl px-4 py-3 transition-all group"
            >
              <span className="text-2xl">{s.logo}</span>
              <div className="flex-1">
                <p className="text-white font-medium text-sm group-hover:text-fire-400 transition-colors">
                  How to Cancel {s.name}
                </p>
                <p className="text-gray-500 text-xs">{s.monthlyPrice}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor[s.difficulty]}`}
              >
                {s.difficulty}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
