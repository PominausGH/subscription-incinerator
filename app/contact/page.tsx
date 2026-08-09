'use client'

import { useState } from 'react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

type Category = 'billing' | 'account' | 'bug' | 'feature' | 'feedback'

const CATEGORY_COPY: Record<Category, { helper: string; placeholder: string }> = {
  billing: {
    helper: 'Question about a charge, invoice, or your plan?',
    placeholder: "What's the billing question — a charge you don't recognize, invoice request, upgrade/downgrade, refund?",
  },
  account: {
    helper: 'Trouble signing in, connecting accounts, or account settings?',
    placeholder: "What's going on with your account — login issues, connecting Gmail/bank, profile settings?",
  },
  bug: {
    helper: 'Tell us what broke — the more detail, the faster we can fix it.',
    placeholder: 'What happened? What did you expect instead? Steps to reproduce, if you can.',
  },
  feature: {
    helper: 'What should we build?',
    placeholder: 'What do you want to be able to do, and why would it help?',
  },
  feedback: {
    helper: 'Anything on your mind.',
    placeholder: "Tell us what's working, what's not, or just say hi.",
  },
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', category: '' as Category | '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', category: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const copy = form.category ? CATEGORY_COPY[form.category] : null

  return (
    <main className="min-h-screen bg-dark-900 flex flex-col">
      <Navigation />

      <div className="flex-1 flex items-center justify-center px-4 py-16 pt-32">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-3">Contact Us</h1>
            <p className="text-gray-400">Got a question or issue? We&apos;ll get back to you within 24 hours.</p>
          </div>

          {status === 'success' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-white font-semibold text-lg mb-2">Message sent!</h2>
              <p className="text-gray-400 text-sm mb-6">We&apos;ll reply to {form.email || 'your email'} within 24 hours.</p>
              <button
                onClick={() => setStatus('idle')}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#121212] rounded-2xl border border-dark-600 p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">What&apos;s this about?</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white focus:outline-none focus:border-orange-500/60 transition-colors text-sm appearance-none"
                >
                  <option value="">Select a topic…</option>
                  <option value="billing">Billing &amp; Payments</option>
                  <option value="account">Account Issue</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="feedback">General Feedback</option>
                </select>
                {copy && <p className="mt-1.5 text-xs text-gray-500">{copy.helper}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={copy?.placeholder ?? 'Describe your issue or question…'}
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors text-sm resize-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-red-400 text-sm">Something went wrong. Please try again or email us directly.</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
