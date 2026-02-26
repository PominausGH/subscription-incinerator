'use client'

import { motion } from 'framer-motion'

const painPoints = [
  {
    icon: '💸',
    title: "That £9.99 charge you didn't recognize",
    description: "You signed up for a free trial 6 months ago. Now you've paid £60 for something you never used.",
  },
  {
    icon: '📧',
    title: "The cancellation email you never sent",
    description: "You meant to cancel before the trial ended. Life got busy. The charge hit anyway.",
  },
  {
    icon: '🔄',
    title: "Subscriptions multiplying quietly",
    description: "Netflix, Spotify, that meditation app, the cloud storage... it adds up to hundreds per year.",
  },
]

export function PainPoints() {
  return (
    <section className="py-24 bg-dark-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Sound Familiar?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-700 rounded-xl p-6 border border-dark-600 hover:border-fire-500/50 transition-colors group"
            >
              <div className="text-4xl mb-4">{point.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-fire-400 transition-colors">
                {point.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
