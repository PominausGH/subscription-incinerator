import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import {
  alternativeCategories,
  alternativeGroups,
  dataVerifiedAt,
  findAlternativesForService,
  totalAlternatives,
} from '@/lib/open-source/alternatives'
import { formatStars, slugify } from '@/lib/open-source/helpers'
import { cancellationServices } from '@/lib/cancel/services'

const BASE_URL = 'https://subscriptionincinerator.app'
const PAGE_URL = `${BASE_URL}/open-source`

const title = `Open Source Alternatives to Paid Subscriptions (${totalAlternatives} Tools)`
const description = `${totalAlternatives} open-source alternatives to paid subscriptions — Google Photos, Notion, Dropbox, Slack, 1Password and more. Licenses, stars and self-hosting notes.`

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: '/open-source',
    types: { 'text/markdown': '/llms-full.txt' },
  },
  openGraph: {
    type: 'website',
    title,
    description,
    url: '/open-source',
  },
}

const verifiedLabel = new Date(`${dataVerifiedAt}T00:00:00Z`).toLocaleDateString('en-AU', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

// Directory names that differ from the cancel-guide service name.
const CANCEL_GUIDE_ALIASES: Record<string, string> = {
  'amazon prime video': 'amazon-prime',
}

/** Slug of the /cancel guide for a paid service, if we have one. */
function cancelGuideSlug(service: string): string | undefined {
  const key = service.toLowerCase()
  const alias = CANCEL_GUIDE_ALIASES[key]
  if (alias) return alias
  return cancellationServices.find(s => s.name.toLowerCase() === key)?.slug
}

// Queries people actually search; each answer is generated from the data below so it can't drift.
const FAQ_SERVICES = [
  'Google Photos',
  'Dropbox',
  'Notion',
  'Slack',
  '1Password',
  'Adobe Creative Cloud',
  'ChatGPT Plus',
  'YNAB',
  'Calendly',
  'Trello',
]

function buildFaqs(): { q: string; a: string }[] {
  const perService = FAQ_SERVICES.flatMap(service => {
    const cat = findAlternativesForService(service)
    if (!cat) return []
    const list = cat.alternatives
      .map(a => `${a.name} (${a.license}${a.stars > 0 ? `, ${formatStars(a.stars)} GitHub stars` : ''})`)
      .join('; ')
    const caveat = cat.alternatives.some(a => a.licenseNote)
      ? ' Some carry license caveats (open core or source-available), noted on their cards.'
      : ''
    return [
      {
        q: `What are the best open-source alternatives to ${service}?`,
        a: `Free alternatives to ${service}: ${list}.${caveat} Install notes and details are on the cards below.`,
      },
    ]
  })

  return [
    {
      q: 'What are the best open-source alternatives to paid subscriptions?',
      a: `This page lists ${totalAlternatives} open-source and source-available tools across ${alternativeCategories.length} categories, each mapped to the paid subscriptions it can replace — for example Immich for Google Photos, Nextcloud for Dropbox, Vaultwarden for 1Password, Actual Budget for YNAB, Plane for Jira, and Umami for Fathom Analytics.`,
    },
    ...perService,
    {
      q: 'Do these tools include the content from Netflix, Spotify, or Audible?',
      a: 'No. Tools like Jellyfin, Navidrome, and Audiobookshelf replace the app, not the catalogue: you supply your own media files. If you cancel Netflix or Spotify you lose their content library.',
    },
    {
      q: 'Are open-source alternatives really free?',
      a: 'The software is free, but self-hosting costs time and usually a server (from about $5 a month for a small VPS, or your own hardware). Several projects also sell optional hosted plans. Desktop apps such as GIMP, Krita, and OBS Studio just run on your computer.',
    },
    {
      q: 'What do "open core" and "source-available" mean on this page?',
      a: 'Open-source licenses (MIT, Apache-2.0, GPL, AGPL) let anyone use, modify, and redistribute the code. "Open core" projects keep most code open but reserve some features under a separate commercial license. "Source-available" licenses, such as BSL-1.1, publish the code but restrict some uses. Any such carve-out is noted on the tool\'s card.',
    },
    {
      q: 'How current is this list?',
      a: `GitHub star counts, licenses, and repository status were last checked in ${verifiedLabel}. Projects hosted outside GitHub keep their previously recorded figures.`,
    },
  ]
}

function spdxUrl(license: string): string | undefined {
  return /^[A-Za-z0-9.+-]+$/.test(license) && /\d/.test(license)
    ? `https://spdx.org/licenses/${license}.html`
    : undefined
}

export default function OpenSourcePage() {
  const faqs = buildFaqs()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        url: PAGE_URL,
        name: title,
        description,
        dateModified: dataVerifiedAt,
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'Subscription Incinerator', url: BASE_URL },
        mainEntity: { '@id': `${PAGE_URL}#list` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Subscription Incinerator', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Open Source Alternatives', item: PAGE_URL },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#list`,
        name: 'Open source alternatives to paid subscriptions',
        numberOfItems: totalAlternatives,
        itemListElement: alternativeCategories
          .flatMap(cat => cat.alternatives.map(alt => ({ cat, alt })))
          .map(({ cat, alt }, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'SoftwareApplication',
              '@id': `${PAGE_URL}#tool-${slugify(alt.name)}`,
              name: alt.name,
              description: alt.description,
              url: alt.websiteUrl,
              sameAs: alt.sourceCodeUrl,
              applicationCategory: cat.category,
              operatingSystem: 'Any',
              isAccessibleForFree: true,
              ...(spdxUrl(alt.license) ? { license: spdxUrl(alt.license) } : {}),
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
          })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <div className="bg-dark-900 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Navigation />
      <main className="pt-16">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <header className="text-center mb-14">
            <p className="text-fire-500 text-sm font-semibold uppercase tracking-wide mb-3">
              Free alternatives
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Open Source Alternatives to Paid Subscriptions
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {totalAlternatives} free, community-built tools that replace popular paid subscriptions
              across {alternativeCategories.length} categories. Many can be self-hosted on a $5/month
              VPS — or run free on your own machine.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Licenses, stars and repository status last checked {verifiedLabel}.{' '}
              <a href="/llms-full.txt" className="text-gray-400 hover:text-fire-400 underline">
                Plain-text version
              </a>
            </p>
          </header>

          {/* Grouped category jump-nav */}
          <nav aria-label="Categories" className="space-y-6 mb-14">
            {alternativeGroups.map(group => (
              <div key={group.key} className="text-center">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
                  {group.label}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {alternativeCategories
                    .filter(cat => cat.group === group.key)
                    .map(cat => (
                      <a
                        key={cat.slug}
                        href={`#${cat.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-full text-gray-300 hover:text-fire-400 text-sm transition-all"
                      >
                        <span>{cat.emoji}</span>
                        {cat.category}
                      </a>
                    ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Browse by subscription: one card per category, service -> free tool rows (crawlable list markup) */}
          <section id="find-your-subscription" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-2">
              Thinking of subscribing? See the free alternative first
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Every paid service on this page next to the open-source tool that can replace it.
            </p>
            <div className="space-y-8">
              {alternativeGroups.map(group => (
                <div key={group.key}>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
                    {group.label}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 items-stretch">
                    {alternativeCategories
                      .filter(cat => cat.group === group.key)
                      .map(cat => (
                        <div
                          key={cat.slug}
                          className="bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-5 transition-all h-full"
                        >
                          <h3 className="mb-2">
                            <a
                              href={`#${cat.slug}`}
                              className="text-white font-semibold flex items-center gap-2 hover:text-fire-400 transition-colors"
                            >
                              <span className="text-xl">{cat.emoji}</span>
                              {cat.category}
                            </a>
                          </h3>
                          <ul className="text-sm">
                            {cat.paidServices.map(service => {
                              const tools = cat.alternatives.filter(a => a.replaces?.includes(service))
                              if (tools.length === 0) return null
                              return (
                                <li
                                  key={service}
                                  className="flex items-baseline justify-between gap-4 py-2 border-t border-dark-700"
                                >
                                  <span className="text-gray-300">
                                    {service}
                                    {cancelGuideSlug(service) && (
                                      <Link
                                        href={`/cancel/${cancelGuideSlug(service)}`}
                                        data-umami-event="oss_cancel_guide_click"
                                        data-umami-event-service={service}
                                        className="ml-2 text-xs text-gray-600 hover:text-fire-400 transition-colors"
                                      >
                                        cancel guide
                                      </Link>
                                    )}
                                  </span>
                                  <span className="text-right text-gray-500">
                                    {tools.map((t, i) => (
                                      <span key={t.name}>
                                        {i > 0 && ', '}
                                        <a
                                          href={`#tool-${slugify(t.name)}`}
                                          className="text-fire-500 hover:text-fire-400"
                                        >
                                          {t.name}
                                        </a>
                                      </span>
                                    ))}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contextual CTA: the reader has just browsed what they pay for */}
          <div className="mb-16 p-6 bg-dark-800 border border-fire-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Recognise a subscription you&apos;re paying for?</p>
              <p className="text-gray-400 text-sm mt-1">
                Add it to Subscription Incinerator and get a reminder before the next charge — free,
                no card needed. Switch to the open-source version whenever you&apos;re ready.
              </p>
            </div>
            <Link
              href="/login"
              data-umami-event="cta_start_free"
              data-umami-event-location="open-source-directory"
              className="inline-flex flex-shrink-0 justify-center px-6 py-3 bg-fire-700 hover:bg-fire-800 text-white font-semibold rounded-lg transition-colors"
            >
              Track it free →
            </Link>
          </div>

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
                  {cat.note && (
                    <p className="text-amber-400/80 text-sm mt-2 max-w-3xl">{cat.note}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {cat.alternatives.map(alt => (
                    <article
                      key={alt.name}
                      id={`tool-${slugify(alt.name)}`}
                      className="bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-5 transition-all flex flex-col scroll-mt-24"
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

                      {alt.replaces && alt.replaces.length > 0 && (
                        <p className="text-gray-500 text-xs mt-3">
                          <span className="text-gray-400 font-medium">Alternative to: </span>
                          {alt.replaces.join(', ')}
                        </p>
                      )}

                      {alt.licenseNote && (
                        <p className="text-amber-400/80 text-xs mt-3 leading-relaxed">
                          <span className="font-medium">License note: </span>
                          {alt.licenseNote}
                        </p>
                      )}

                      {alt.installInstructions && (
                        <p className="text-gray-500 text-xs mt-3 pt-3 border-t border-dark-700 leading-relaxed">
                          <span className="text-emerald-400 font-medium">Self-host: </span>
                          {alt.installInstructions}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dark-700">
                        <a
                          href={alt.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-umami-event="oss_link_click"
                          data-umami-event-tool={alt.name}
                          data-umami-event-kind="website"
                          className="text-fire-500 hover:text-fire-400 text-sm font-medium transition-colors"
                        >
                          Website →
                        </a>
                        <a
                          href={alt.sourceCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-umami-event="oss_link_click"
                          data-umami-event-tool={alt.name}
                          data-umami-event-kind="source"
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

          {/* FAQ (mirrors the FAQPage JSON-LD) */}
          <section id="faq" className="mt-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqs.map(f => (
                <details
                  key={f.q}
                  className="bg-dark-800 border border-dark-600 rounded-xl px-5 py-4 group"
                >
                  <summary className="text-white font-medium cursor-pointer list-none flex justify-between gap-4">
                    <h3 className="text-base font-medium">{f.q}</h3>
                    <span className="text-gray-500 group-open:rotate-45 transition-transform flex-shrink-0">+</span>
                  </summary>
                  <p className="text-gray-400 text-sm mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

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
              data-umami-event="cta_start_free"
              data-umami-event-location="open-source-footer"
              className="inline-flex px-6 py-3 bg-fire-700 hover:bg-fire-800 text-white font-semibold rounded-lg transition-colors"
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
