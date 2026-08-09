'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

function isUK(): boolean {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/London'
  } catch {
    return false
  }
}

const painPoints = (symbol: string) => [
  {
    title: `That ${symbol}9.99 charge you didn't recognise`,
    description: `You signed up for a free trial 6 months ago. Now you've paid ${symbol}60 for something you've never opened. You only noticed because you were going through statements manually.`,
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
    accentClass: 'border-l-fire-500',
  },
  {
    title: "The cancellation you never got around to",
    description: "You meant to cancel before the trial ended. Life got busy. The charge hit on a Sunday and by Monday you'd forgotten again.",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M9 16l2 2 4-4"/>
      </svg>
    ),
    accentClass: 'border-l-purple-500',
  },
  {
    title: "Subscriptions multiplying quietly",
    description: "Netflix, Spotify, that meditation app, the cloud storage, the password manager, the VPN you trialled once. Each one is reasonable. Together they're hundreds per year.",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
    ),
    accentClass: 'border-l-green-500',
  },
]


export function PainPoints() {
  const [currencySymbol, setCurrencySymbol] = useState('$')

  useEffect(() => {
    setCurrencySymbol(isUK() ? '£' : '$')
  }, [])

  return (
    <section className="py-24 bg-dark-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Sound familiar?
          </h2>
          <p className="text-gray-400 text-base">
            The average person wastes <span className="text-fire-400 font-semibold">{currencySymbol}273</span> a year on subscriptions they forgot about.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {painPoints(currencySymbol).map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`bg-dark-700 rounded-xl p-6 border border-dark-600 border-l-2 ${point.accentClass} hover:shadow-lg transition-all group`}
            >
              <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center text-gray-400 group-hover:text-fire-400 mb-4 transition-colors">
                {point.svg}
              </div>
              <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-fire-400 transition-colors">
                {point.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
