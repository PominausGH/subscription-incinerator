'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-900">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900" />

      {/* Ember particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-fire-500 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: typeof window !== 'undefined' ? window.innerHeight + 10 : 800,
              opacity: 0.6,
            }}
            animate={{
              y: -10,
              opacity: 0,
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Never Pay for a Forgotten Subscription{' '}
              <span className="text-fire-500">Again</span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed">
              We&apos;ve all been there. That Netflix trial you meant to cancel. The gym
              membership you forgot about. Subscription Incinerator tracks them all
              and reminds you before you get charged.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-fire-500 hover:bg-fire-600 rounded-lg transition-all glow-fire hover:scale-105"
              >
                Start Free
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-300 border border-dark-500 hover:border-fire-500 rounded-lg transition-colors"
              >
                Learn More
              </a>
            </div>
          </motion.div>

          {/* App mockup placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative bg-dark-700 rounded-xl p-4 border border-dark-600 glow-fire">
              <div className="bg-dark-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
                  <div>
                    <div className="text-white font-medium">Netflix</div>
                    <div className="text-sm text-gray-400">Trial ends in 2 days</div>
                  </div>
                  <div className="ml-auto text-fire-500 font-semibold">£9.99/mo</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                  <div>
                    <div className="text-white font-medium">Spotify</div>
                    <div className="text-sm text-gray-400">Renews in 5 days</div>
                  </div>
                  <div className="ml-auto text-gray-400 font-semibold">£10.99/mo</div>
                </div>
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                  <div>
                    <div className="text-white font-medium line-through">Adobe CC</div>
                    <div className="text-sm text-fire-500">Cancelled</div>
                  </div>
                  <div className="ml-auto text-gray-500 font-semibold line-through">£54.99/mo</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
