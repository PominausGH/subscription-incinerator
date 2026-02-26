import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Subscription Incinerator',
  description: 'Privacy Policy for Subscription Incinerator',
}

export default function PrivacyPage() {
  return (
    <main className="bg-dark-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/" className="text-fire-400 hover:text-fire-300 text-sm mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: February 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              When you create an account, we collect your email address and a hashed version of your password.
              We never store your password in plain text.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              If you connect your Gmail account, we request <strong className="text-white">read-only</strong> access
              to scan for subscription-related emails. We cannot send, delete, or modify your emails.
              OAuth tokens are encrypted at rest using AES-256-GCM encryption.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              If you upload bank statements, the CSV file is processed in memory and only the detected
              subscription data you approve is stored. Raw CSV files are not retained.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li>To provide subscription tracking and reminder notifications</li>
              <li>To detect recurring subscriptions from email or bank data you provide</li>
              <li>To send you renewal and trial-ending reminders via email or push notifications</li>
              <li>To process payments if you upgrade to premium</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Storage and Security</h2>
            <p className="text-gray-300 leading-relaxed">
              Your data is stored in encrypted databases. OAuth tokens are encrypted with AES-256-GCM.
              Passwords are hashed using bcrypt. All connections use TLS encryption.
              We do not sell, share, or provide your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li><strong className="text-white">Google Gmail API:</strong> Used only with your explicit consent for email scanning</li>
              <li><strong className="text-white">Stripe:</strong> Processes premium subscription payments securely</li>
              <li><strong className="text-white">Resend:</strong> Sends transactional emails (reminders, notifications)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              You can disconnect your Gmail account at any time from Settings. You can delete your
              account and all associated data by contacting us. You can export your subscription
              data from the dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For privacy concerns, email us at{' '}
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
