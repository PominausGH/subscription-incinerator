import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why we built Subscription Incinerator — and what it actually does.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About — Subscription Incinerator',
    description: 'Why we built Subscription Incinerator — and what it actually does.',
    url: '/about',
  },
}

export default function AboutPage() {
  return (
    <div className="bg-dark-900 min-h-screen">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <header className="mb-12">
            <span className="text-fire-500 text-sm font-medium">About</span>
            <h1 className="text-4xl font-bold text-white mt-2 mb-4">Why I Built This</h1>
          </header>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <p>
              A few years ago I was doing a lazy Sunday audit of my bank statements and found
              something embarrassing: I had been paying for a gym membership I hadn&apos;t used in
              14 months. Then a VPN trial I&apos;d signed up for and forgotten about. Then a design
              tool I&apos;d tried for a single project and never opened again.
            </p>
            <p>
              In total, I was burning through roughly <strong className="text-white">$280/year</strong> on
              things I couldn&apos;t even name if you&apos;d asked me the day before. And I&apos;m not
              particularly disorganised — this just happens to everyone now that signing up for
              things takes 30 seconds and cancelling takes effort.
            </p>
            <p>
              I tried existing subscription trackers. Most were either too manual (you had to
              enter everything yourself) or too intrusive (requiring full bank account access).
              None of them did the thing I actually wanted: <em>find the subscriptions I didn&apos;t
              know about</em>.
            </p>

            <h2 className="text-2xl font-bold text-white pt-4">What Subscription Incinerator Does</h2>
            <p>
              It connects to your Gmail (read-only) and scans for subscription receipts and
              renewal notices. It uses AI to parse these emails and surfaces anything that looks
              like a recurring charge — with a confidence score, so you can decide whether to add
              it to your tracker or dismiss it.
            </p>
            <p>
              You can also import bank statements directly if you prefer not to connect Gmail.
              The import parser recognises common merchant names and flags recurring amounts.
            </p>
            <p>
              Once you&apos;ve built your subscription list, it sends reminders before billing dates
              so you&apos;re never surprised by a charge. It tracks your total monthly cost and shows
              you trends over time.
            </p>
            <p>
              The core tool is free. There&apos;s a premium tier ($9/mo) for users who want Gmail
              scanning and bank imports — the detection features rather than just the tracker.
            </p>

            <h2 className="text-2xl font-bold text-white pt-4">The Team</h2>
            <p>
              It&apos;s just me. Solo project, built in the evenings. No VC funding, no growth
              targets — just a tool I wanted to exist.
            </p>
            <p>
              If you have feedback, find a bug, or want a feature that doesn&apos;t exist yet,
              the best way to reach me is through the app.
            </p>

            <h2 className="text-2xl font-bold text-white pt-4">On Privacy</h2>
            <p>
              Gmail access is read-only. We can&apos;t send emails, can&apos;t delete emails, can&apos;t
              modify anything. We only read emails that match subscription-related patterns, and
              we only store the structured subscription data you approve.
            </p>
            <p>
              Bank statement imports are processed locally — we extract merchant and amount data
              and store only what you explicitly approve as a subscription.
            </p>
            <p>
              We don&apos;t sell data. We don&apos;t have advertisers. The business model is the
              premium subscription — that&apos;s it.
            </p>
          </div>

          <div className="mt-12 p-6 bg-dark-800 border border-fire-500/30 rounded-xl text-center">
            <p className="text-white font-semibold mb-2">Try it free</p>
            <p className="text-gray-400 text-sm mb-4">
              No credit card required. The core tracker is free forever.
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
