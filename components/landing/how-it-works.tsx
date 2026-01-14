'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Sign Up Free',
    description: 'Create an account with just your email. No credit card, no commitment.',
  },
  {
    number: '02',
    title: 'Connect Your Sources',
    description: 'Link your Gmail for automatic detection, upload bank statements, or add subscriptions manually.',
  },
  {
    number: '03',
    title: 'Relax & Get Reminded',
    description: "We'll alert you before trials end and charges hit. Cancel what you don't need.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-dark-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Get Started in 3 Steps
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative text-center"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-fire-500 to-fire-700" />
              )}

              <div className="relative">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-dark-700 border-2 border-fire-500 mb-6">
                  <span className="text-3xl font-bold text-fire-500">{step.number}</span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xl text-gray-300 mb-6">Ready to Take Control?</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-fire-500 hover:bg-fire-600 rounded-lg transition-all glow-fire hover:scale-105"
          >
            Start Free
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
