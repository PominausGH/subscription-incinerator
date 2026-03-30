'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const freeFeatures = [
  { label: 'Track up to 10 subscriptions manually', included: true },
  { label: 'Renewal reminders', included: true },
  { label: 'Basic spending summary', included: true },
  { label: '3 category presets', included: true },
  { label: 'Unlimited subscriptions', included: false },
  { label: 'Gmail auto-scan', included: false },
  { label: 'Bank statement import (CSV)', included: false },
  { label: 'Bank account linking (Plaid)', included: false },
  { label: 'Full category breakdown', included: false },
  { label: 'Savings goals', included: false },
  { label: 'Cancellation assistant', included: false },
  { label: 'Priority support', included: false },
]

const premiumFeatures = [
  { label: 'Everything in Free', included: true },
  { label: 'Unlimited subscriptions', included: true },
  { label: 'Gmail auto-scan', included: true },
  { label: 'Bank statement import (CSV)', included: true },
  { label: 'Bank account linking (Plaid)', included: true },
  { label: 'Full category breakdown', included: true },
  { label: 'Savings goals', included: true },
  { label: 'Cancellation assistant', included: true },
  { label: 'Priority support', included: true },
]

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function UpgradeCTA() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      if (res.status === 401) {
        window.location.href = '/login?callbackUrl=/pricing'
        return
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full py-3.5 px-6 rounded-lg font-semibold text-white text-base bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? 'Loading…' : 'Start 7-Day Free Trial'}
    </button>
  )
}

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  const monthlyPrice = 9
  const annualMonthlyEquivalent = (79 / 12).toFixed(2)
  const annualSavings = Math.round((1 - 79 / (monthlyPrice * 12)) * 100)

  return (
    <section id="pricing" className="py-24 bg-dark-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Start free. Upgrade when you&apos;re ready to go further.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-[#121212] border border-dark-600 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual
                  ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual
                  ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual
              <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                Save {annualSavings}%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Free card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-[#121212] rounded-2xl border border-dark-600 p-8"
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Free</h3>
              <p className="text-gray-500 text-sm">For getting started</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-500 mb-1">/ forever</span>
              </div>
            </div>

            <Link
              href="/login"
              className="block w-full py-3.5 px-6 rounded-lg font-semibold text-center text-gray-300 border border-dark-500 hover:border-orange-500/50 hover:text-white transition-all text-base"
            >
              Get Started Free
            </Link>

            <ul className="mt-8 space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature.label} className="flex items-start gap-3">
                  {feature.included ? <CheckIcon /> : <CrossIcon />}
                  <span
                    className={`text-sm leading-snug ${
                      feature.included ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Premium card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative bg-[#121212] rounded-2xl border border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)] p-8"
          >
            {/* Most popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-orange-600 to-orange-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_14px_rgba(249,115,22,0.4)] whitespace-nowrap">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Premium</h3>
              <p className="text-gray-500 text-sm">For full control</p>
              <div className="mt-4 flex items-end gap-1">
                {annual ? (
                  <>
                    <span className="text-4xl font-bold text-white">${annualMonthlyEquivalent}</span>
                    <span className="text-gray-500 mb-1">/ mo</span>
                    <span className="ml-2 text-sm text-gray-500 mb-1 line-through">${monthlyPrice}</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-white">${monthlyPrice}</span>
                    <span className="text-gray-500 mb-1">/ month</span>
                  </>
                )}
              </div>
              {annual && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-400 mt-1"
                >
                  Billed $79/year — you save ${monthlyPrice * 12 - 79}
                </motion.p>
              )}
            </div>

            <UpgradeCTA />

            <p className="text-center text-xs text-gray-500 mt-3">
              7-day free trial · Cancel anytime
            </p>

            <ul className="mt-8 space-y-3">
              {premiumFeatures.map((feature) => (
                <li key={feature.label} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-gray-300 leading-snug">{feature.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
