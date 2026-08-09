'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const steps = [
  {
    number: '1',
    title: 'Sign up — takes 30 seconds',
    description: 'Just your email. No credit card, no commitment. The free tier stays free.',
    detail: 'GBP, USD, EUR & more supported from day one.',
    side: 'left',
  },
  {
    number: '2',
    title: 'Connect your sources',
    description: 'Link Gmail for automatic detection, upload a bank statement CSV, or add subscriptions manually — however works for you.',
    detail: 'Read-only Gmail access. We can\'t send, delete, or modify anything.',
    side: 'right',
  },
  {
    number: '3',
    title: 'Cancel what you don\'t need',
    description: 'We alert you before trials end and charges hit. Each subscription gets step-by-step cancellation instructions.',
    detail: 'Alerts at 24h, 3h, and 1h before the charge.',
    side: 'left',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-dark-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Up and running in minutes
          </h2>
          <p className="text-gray-400 text-lg">No configuration. No learning curve.</p>
        </motion.div>

        <div className="space-y-12 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: step.side === 'left' ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`flex gap-8 items-start ${step.side === 'right' ? 'md:flex-row-reverse' : ''}`}
            >
              {/* Step number */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-dark-700 border-2 border-fire-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-fire-500">{step.number}</span>
                </div>
              </div>

              {/* Content */}
              <div className={`bg-dark-700 rounded-xl p-6 border border-dark-600 flex-1 ${step.side === 'right' ? 'border-r-2 border-r-purple-500' : 'border-l-2 border-l-fire-500'}`}>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed mb-3">{step.description}</p>
                <p className="text-sm text-fire-400/80 italic">{step.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-fire-500 hover:bg-fire-600 rounded-lg transition-all glow-fire hover:scale-105"
          >
            Start free — no card needed
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
