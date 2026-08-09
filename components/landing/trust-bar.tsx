'use client'

import { motion } from 'framer-motion'

const trustItems = [
  { icon: '🔒', title: 'Bank-level encryption', desc: 'All data encrypted at rest and in transit' },
  { icon: '📵', title: 'Read-only Gmail access', desc: "We can't send emails or modify anything" },
  { icon: '🚫', title: 'We never sell your data', desc: 'Your subscriptions stay private, always' },
  { icon: '✅', title: 'GDPR compliant', desc: 'Delete your data anytime, instantly' },
]

export function TrustBar() {
  return (
    <section className="py-16 bg-dark-900 border-y border-dark-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {trustItems.map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{item.icon}</span>
              <p className="text-white font-semibold text-sm">{item.title}</p>
              <p className="text-gray-400 text-xs">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
