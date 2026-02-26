import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Subscription Incinerator',
  description: 'Terms of Service for Subscription Incinerator',
}

export default function TermsPage() {
  return (
    <main className="bg-dark-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/" className="text-fire-400 hover:text-fire-300 text-sm mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: February 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using Subscription Incinerator, you agree to be bound by these Terms of Service.
              If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              Subscription Incinerator is a subscription management tool that helps you track recurring
              charges, receive renewal reminders, and manage your subscriptions. We provide detection
              tools and cancellation guidance, but we do not cancel subscriptions on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li>You must provide a valid email address to create an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must not share your account credentials with others</li>
              <li>You must be at least 18 years old to use this service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Premium Subscriptions</h2>
            <p className="text-gray-300 leading-relaxed">
              Premium features are available through a paid subscription processed by Stripe.
              You may cancel your premium subscription at any time. Refunds are handled on a
              case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Accuracy of Information</h2>
            <p className="text-gray-300 leading-relaxed">
              Subscription detection is automated and may not be 100% accurate. We use AI-powered
              analysis to identify subscriptions, but you should always review and verify detected
              subscriptions before taking action. We are not liable for missed or incorrectly
              identified subscriptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              Subscription Incinerator is provided &quot;as is&quot; without warranties of any kind. We are not
              responsible for any charges incurred due to missed reminders, inaccurate detection,
              or service downtime. Our total liability is limited to the amount you have paid for
              premium services in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms or
              abuse the service. You may delete your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these terms, email us at{' '}
              <a href="mailto:support@subscriptionincinerator.app" className="text-fire-400 hover:text-fire-300">
                support@subscriptionincinerator.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
