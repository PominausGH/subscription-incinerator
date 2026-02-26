'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: '📬',
    title: 'Automatic Email Detection',
    description: "Connect your Gmail and we'll find subscription receipts automatically. No manual entry needed.",
  },
  {
    icon: '🏦',
    title: 'Bank Statement Import',
    description: 'Upload a CSV and our AI spots recurring charges you might have missed.',
  },
  {
    icon: '🔔',
    title: 'Never Miss a Trial Ending',
    description: 'Get reminded 24 hours, 3 hours, and 1 hour before your free trial converts to paid.',
  },
  {
    icon: '🚪',
    title: 'Step-by-Step Cancellation',
    description: 'Clear instructions for cancelling Netflix, Spotify, and 40+ other services.',
  },
  {
    icon: '📊',
    title: 'See Where Your Money Goes',
    description: 'Monthly totals, category breakdowns, and your biggest subscription spenders.',
  },
  {
    icon: '✅',
    title: "You're in Control",
    description: 'We suggest subscriptions we find - you decide what to track.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-dark-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything You Need to Take Control
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Powerful features to find, track, and eliminate unwanted subscriptions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-700 rounded-xl p-6 border border-dark-600 hover:border-fire-500/50 hover:glow-fire transition-all group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-fire-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
