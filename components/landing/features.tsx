'use client'

import { motion } from 'framer-motion'

const features = [
  {
    title: 'Automatic email detection',
    description:
      "Connect Gmail with one click. We scan for subscription receipts, trial confirmations, and renewal notices — then surface them so you can decide what to keep. Read-only access, nothing else.",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
    accent: 'border-t-fire-500',
    iconBg: 'bg-fire-500/10 border-fire-500/20 text-fire-400',
    featured: true,
  },
  {
    title: 'Bank statement import',
    description: 'Upload a CSV from your bank and our AI identifies recurring charges you may have forgotten about.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
      </svg>
    ),
    accent: 'border-t-purple-500',
    iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  },
  {
    title: 'Trial-end reminders',
    description: 'Alerts at 24h, 3h, and 1h before a free trial flips to paid. Cancel on your terms.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    accent: 'border-t-green-500',
    iconBg: 'bg-green-500/10 border-green-500/20 text-green-400',
  },
  {
    title: 'Step-by-step cancellation guides',
    description: 'Clear instructions for Netflix, Spotify, Adobe CC, and 40+ other services. We tell you exactly where to click.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    accent: 'border-t-fire-500',
    iconBg: 'bg-fire-500/10 border-fire-500/20 text-fire-400',
  },
  {
    title: 'Spending breakdown',
    description: 'Monthly totals, category splits, biggest spenders. See the full picture in one view.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 3v18h18"/>
        <path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
    accent: 'border-t-purple-500',
    iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  },
  {
    title: 'You approve everything',
    description: "We suggest what we find. You decide what to track. Nothing gets added without your say.",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    accent: 'border-t-green-500',
    iconBg: 'bg-green-500/10 border-green-500/20 text-green-400',
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
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            What actually happens when you connect
          </h2>
          <p className="text-gray-400 text-lg max-w-xl">
            No spreadsheets. No manual entry. Just your subscriptions, found and managed.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={`bg-dark-700 rounded-xl p-6 border border-dark-600 border-t-2 hover:border-t-2 ${feature.accent} hover:shadow-lg transition-all group ${feature.featured ? 'lg:col-span-1' : ''}`}
            >
              <div className={`w-11 h-11 rounded-lg border flex items-center justify-center mb-4 ${feature.iconBg}`}>
                {feature.svg}
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
