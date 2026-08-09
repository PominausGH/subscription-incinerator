import Link from 'next/link'
import type { CompetitorAlternative } from '@/lib/alternatives/competitors'

export function CompetitorAlternativePage({ data }: { data: CompetitorAlternative }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-8 text-sm text-gray-500">
        <Link href="/" className="hover:text-fire-400 transition-colors">
          Subscription Incinerator
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-300">{data.competitorName} Alternative</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-3">
          A {data.competitorName} Alternative Without Bank Linking
        </h1>
        <p className="text-gray-400 leading-relaxed">{data.intro}</p>
      </header>

      {data.isDefunct && data.defunctNote && (
        <div className="bg-dark-800 border border-yellow-500/20 rounded-xl p-4 mb-10 text-sm text-gray-400">
          <span className="text-yellow-400 font-medium">Heads up: </span>
          {data.defunctNote}
        </div>
      )}

      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">
          Subscription Incinerator vs. {data.competitorName}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-dark-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-800 text-left">
                <th className="p-3 font-semibold text-gray-300">Feature</th>
                <th className="p-3 font-semibold text-fire-400">Subscription Incinerator</th>
                <th className="p-3 font-semibold text-gray-400">{data.competitorName}</th>
              </tr>
            </thead>
            <tbody>
              {data.comparisonRows.map((row) => (
                <tr key={row.feature} className="border-t border-dark-700">
                  <td className="p-3 text-gray-300 font-medium align-top">{row.feature}</td>
                  <td className={`p-3 align-top ${row.usWins ? 'text-white' : 'text-gray-300'}`}>
                    {row.usWins && <span className="text-green-400 mr-1">✓</span>}
                    {row.us}
                  </td>
                  <td className="p-3 text-gray-500 align-top">{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Pricing and features for {data.competitorName} are based on publicly available information and may change — check their site for current terms.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Why people switch</h2>
        <ul className="space-y-3">
          {data.whySwitch.map((reason, i) => (
            <li key={i} className="flex gap-3 bg-dark-800 border border-dark-600 rounded-xl p-4 text-sm text-gray-300">
              <span className="text-fire-500 flex-shrink-0">→</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="p-6 bg-dark-700 rounded-xl border border-fire-500/30 text-center mb-12">
        <p className="text-white font-semibold mb-2">Track your subscriptions without linking a bank account</p>
        <p className="text-gray-400 text-sm mb-4">
          Free for up to 10 subscriptions, forever. Premium unlocks Gmail auto-scan and cancellation guides for $9/mo.
        </p>
        <Link
          href="/login"
          className="inline-flex px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors"
        >
          Start Free →
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-bold text-white mb-4">Questions</h2>
        <div className="space-y-4">
          {data.faq.map((item) => (
            <div key={item.q}>
              <p className="text-white font-medium text-sm mb-1">{item.q}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
