'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function ProductHuntHero() {
  return (
    <section className="relative overflow-hidden bg-dark-900 pt-32 pb-20">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium mb-8"
        >
          🚀 Live on Product Hunt today — get 1 month free (code PHLAUNCH)
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
        >
          Never Pay for a Forgotten Subscription <span className="text-fire-500">Again</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto"
        >
          I counted twelve active subscriptions one January — four were AI tools I&apos;d tried
          once and forgotten, three were streaming services replaying reruns to nobody. That&apos;s
          when I stopped trusting my memory and built something that watches my inbox instead.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-fire-500 hover:bg-fire-600 rounded-lg transition-all glow-fire hover:scale-105"
          >
            Start Free
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-300 border border-dark-500 hover:border-fire-500 rounded-lg transition-colors"
          >
            See the Product Hunt Offer
          </a>
        </motion.div>

        <p className="mt-4 text-sm text-gray-500">
          Free plan forever · Premium trial extended to 1 month for Product Hunt readers
        </p>
      </div>
    </section>
  )
}
