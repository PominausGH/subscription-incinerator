'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    quote: "Found £340 worth of forgotten subscriptions in my first scan. Cancelled 4 of them immediately. Can't believe I was paying for these.",
    name: "James T.",
    location: "London, UK",
    saved: "£340/yr",
    initials: "JT",
    color: "bg-fire-600",
  },
  {
    quote: "That Adobe trial I forgot to cancel from 8 months ago? Gone. The reminder system is exactly what I needed — it fires before the charge hits.",
    name: "Sarah M.",
    location: "Manchester, UK",
    saved: "$127/yr",
    initials: "SM",
    color: "bg-purple-600",
  },
  {
    quote: "I run a small business and we had subscriptions no one even remembered signing up for. Cleaned up over $600 in annual charges in one afternoon.",
    name: "Mike R.",
    location: "Austin, TX",
    saved: "$600/yr",
    initials: "MR",
    color: "bg-green-600",
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-dark-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Real Money. Real Savings.
          </h2>
          <p className="text-gray-400 text-lg">What our users found when they ran their first scan</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-dark-700 rounded-xl p-6 border border-dark-600 hover:border-fire-500/40 transition-all"
            >
              <p className="text-gray-300 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.location}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-fire-400 font-bold text-sm">Saved {t.saved}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
