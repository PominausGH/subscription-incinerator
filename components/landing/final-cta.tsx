'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-fire-900 via-fire-800 to-fire-900 relative overflow-hidden">
      {/* Animated embers */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-fire-400 rounded-full opacity-60"
            initial={{
              x: Math.random() * 100 + '%',
              y: '110%',
            }}
            animate={{
              y: '-10%',
              opacity: [0.6, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Stop Paying for Subscriptions You Don't Use
          </h2>
          <p className="text-xl text-fire-100 mb-8">
            Join thousands of users who've taken control of their subscriptions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-10 py-5 text-xl font-semibold text-fire-900 bg-white hover:bg-fire-50 rounded-lg transition-all hover:scale-105"
          >
            Start Free - No Credit Card Required
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
