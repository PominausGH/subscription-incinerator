'use client'

import { motion } from 'framer-motion'

export function Solution() {
  return (
    <section className="py-24 bg-dark-900 relative overflow-hidden">
      {/* Fire gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-fire-900/20 via-transparent to-fire-900/20" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="text-6xl mb-6">🔥</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Burn the Subscriptions You Don't Need
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Subscription Incinerator scans your emails and bank statements, finds every
            subscription, and reminds you before charges hit.{' '}
            <span className="text-fire-500 font-semibold">Free.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
