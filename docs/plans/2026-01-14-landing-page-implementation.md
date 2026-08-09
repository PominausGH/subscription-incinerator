# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dark fire-themed landing page that converts visitors and educates them about Subscription Incinerator's features.

**Architecture:** Single-page design with smooth scroll navigation. Reusable section components. Framer Motion for animations. All components in `components/landing/`.

**Tech Stack:** Next.js 14, Tailwind CSS, Framer Motion, TypeScript

---

## Task 1: Setup - Dependencies and Theme Config

**Files:**
- Modify: `package.json`
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Step 1: Install Framer Motion**

Run:
```bash
npm install framer-motion
```

Expected: Package added to dependencies

**Step 2: Extend Tailwind config with fire theme colors**

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        fire: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        dark: {
          900: '#0a0a0a',
          800: '#121212',
          700: '#1a1a1a',
          600: '#242424',
          500: '#2e2e2e',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 3: Update globals.css for dark theme**

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: system-ui, -apple-system, sans-serif;
}

html {
  scroll-behavior: smooth;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .gradient-fire {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%);
  }

  .gradient-dark {
    background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
  }

  .glow-fire {
    box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
  }
}
```

**Step 4: Commit setup changes**

```bash
git add package.json package-lock.json tailwind.config.ts app/globals.css
git commit -m "chore: add framer-motion and fire theme config"
```

---

## Task 2: Navigation Component

**Files:**
- Create: `components/landing/navigation.tsx`

**Step 1: Create the navigation component**

Create `components/landing/navigation.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-dark-900/95 backdrop-blur-sm border-b border-dark-600' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-white">Subscription Incinerator</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-fire-400 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="px-4 py-2 bg-fire-500 hover:bg-fire-600 text-white rounded-lg transition-colors"
            >
              Login
            </Link>
          </div>

          <button className="md:hidden text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
```

**Step 2: Commit navigation**

```bash
git add components/landing/navigation.tsx
git commit -m "feat(landing): add sticky navigation component"
```

---

## Task 3: Hero Section

**Files:**
- Create: `components/landing/hero.tsx`

**Step 1: Create the hero component**

Create `components/landing/hero.tsx`:

```typescript
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
              We've all been there. That Netflix trial you meant to cancel. The gym
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
```

**Step 2: Commit hero**

```bash
git add components/landing/hero.tsx
git commit -m "feat(landing): add hero section with ember particles"
```

---

## Task 4: Pain Points Section

**Files:**
- Create: `components/landing/pain-points.tsx`

**Step 1: Create the pain points component**

Create `components/landing/pain-points.tsx`:

```typescript
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
              key={index}
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
```

**Step 2: Commit pain points**

```bash
git add components/landing/pain-points.tsx
git commit -m "feat(landing): add pain points section"
```

---

## Task 5: Solution Section

**Files:**
- Create: `components/landing/solution.tsx`

**Step 1: Create the solution component**

Create `components/landing/solution.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'

export function Solution() {
  return (
    <section className="py-24 bg-dark-900 relative overflow-hidden">
      {/* Fire gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-fire-900/20 via-transparent to-fire-900/20" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="text-6xl mb-6">🔥</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Burn the Subscriptions You Don't Need
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Subscription Incinerator scans your emails and bank statements, finds every
            subscription, and reminds you before charges hit.{' '}
            <span className="text-fire-500 font-semibold">Free.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
```

**Step 2: Commit solution**

```bash
git add components/landing/solution.tsx
git commit -m "feat(landing): add solution reveal section"
```

---

## Task 6: Features Grid

**Files:**
- Create: `components/landing/features.tsx`

**Step 1: Create the features component**

Create `components/landing/features.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: '📬',
    title: 'Automatic Email Detection',
    description: "Connect your Gmail and we'll find subscription receipts automatically. No manual entry needed.",
  },
  {
    icon: '🏦',
    title: 'Bank Statement Import',
    description: 'Upload a CSV and our AI spots recurring charges you might have missed.',
  },
  {
    icon: '🔔',
    title: 'Never Miss a Trial Ending',
    description: 'Get reminded 24 hours, 3 hours, and 1 hour before your free trial converts to paid.',
  },
  {
    icon: '🚪',
    title: 'Step-by-Step Cancellation',
    description: 'Clear instructions for cancelling Netflix, Spotify, and 40+ other services.',
  },
  {
    icon: '📊',
    title: 'See Where Your Money Goes',
    description: 'Monthly totals, category breakdowns, and your biggest subscription spenders.',
  },
  {
    icon: '✅',
    title: "You're in Control",
    description: 'We suggest subscriptions we find - you decide what to track.',
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
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything You Need to Take Control
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Powerful features to find, track, and eliminate unwanted subscriptions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-700 rounded-xl p-6 border border-dark-600 hover:border-fire-500/50 hover:glow-fire transition-all group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
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
```

**Step 2: Commit features**

```bash
git add components/landing/features.tsx
git commit -m "feat(landing): add features grid section"
```

---

## Task 7: How It Works Section

**Files:**
- Create: `components/landing/how-it-works.tsx`

**Step 1: Create the how it works component**

Create `components/landing/how-it-works.tsx`:

```typescript
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
```

**Step 2: Commit how it works**

```bash
git add components/landing/how-it-works.tsx
git commit -m "feat(landing): add how it works section"
```

---

## Task 8: FAQ Section

**Files:**
- Create: `components/landing/faq.tsx`

**Step 1: Create the FAQ component with accordion**

Create `components/landing/faq.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: 'Is it really free?',
    answer: "Yes, completely free. No hidden charges, no premium tier required. We're building our user base and will add optional paid features later - but the core app will always be free.",
  },
  {
    question: 'Is my data safe?',
    answer: "We only request read-only access to your Gmail - we can't send emails or modify anything. Your bank statements are processed locally and we only store the subscription data you approve. We never sell your data.",
  },
  {
    question: 'What if you miss a subscription?',
    answer: "No detection is perfect. You can always add subscriptions manually, and our pending review system lets you approve or dismiss anything we find. You're always in control.",
  },
  {
    question: 'Which email providers do you support?',
    answer: 'Currently Gmail only. Outlook and other providers are on our roadmap.',
  },
  {
    question: 'Can you cancel subscriptions for me?',
    answer: 'Not yet - we provide step-by-step instructions to help you cancel yourself. Automated cancellation is coming in a future update.',
  },
]

function FAQItem({ question, answer, isOpen, onClick }: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <div className="border-b border-dark-600">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-fire-400' : 'text-white'}`}>
          {question}
        </span>
        <span className={`text-2xl transition-transform ${isOpen ? 'rotate-45 text-fire-500' : 'text-gray-400'}`}>
          +
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 bg-dark-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Questions? We've Got Answers
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-dark-700 rounded-xl border border-dark-600 px-6"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

**Step 2: Commit FAQ**

```bash
git add components/landing/faq.tsx
git commit -m "feat(landing): add FAQ accordion section"
```

---

## Task 9: Final CTA Section

**Files:**
- Create: `components/landing/final-cta.tsx`

**Step 1: Create the final CTA component**

Create `components/landing/final-cta.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-fire-900 via-fire-800 to-fire-900 relative overflow-hidden">
      {/* Animated embers */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-fire-400 rounded-full opacity-60"
            initial={{
              x: Math.random() * 100 + '%',
              y: '110%',
            }}
            animate={{
              y: '-10%',
              opacity: [0.6, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Stop Paying for Subscriptions You Don't Use
          </h2>
          <p className="text-xl text-fire-100 mb-8">
            Join thousands of users who've taken control of their subscriptions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-10 py-5 text-xl font-semibold text-fire-900 bg-white hover:bg-fire-50 rounded-lg transition-all hover:scale-105"
          >
            Start Free - No Credit Card Required
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
```

**Step 2: Commit final CTA**

```bash
git add components/landing/final-cta.tsx
git commit -m "feat(landing): add final CTA section with embers"
```

---

## Task 10: Footer Component

**Files:**
- Create: `components/landing/footer.tsx`

**Step 1: Create the footer component**

Create `components/landing/footer.tsx`:

```typescript
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-12 bg-dark-900 border-t border-dark-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo column */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-white">Subscription Incinerator</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Never forget another subscription.
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="mailto:support@example.com" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-dark-700 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Subscription Incinerator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

**Step 2: Commit footer**

```bash
git add components/landing/footer.tsx
git commit -m "feat(landing): add footer component"
```

---

## Task 11: Barrel Export and Page Assembly

**Files:**
- Create: `components/landing/index.ts`
- Modify: `app/page.tsx`

**Step 1: Create barrel export**

Create `components/landing/index.ts`:

```typescript
export { Navigation } from './navigation'
export { Hero } from './hero'
export { PainPoints } from './pain-points'
export { Solution } from './solution'
export { Features } from './features'
export { HowItWorks } from './how-it-works'
export { FAQ } from './faq'
export { FinalCTA } from './final-cta'
export { Footer } from './footer'
```

**Step 2: Replace page.tsx with landing page**

Replace `app/page.tsx` with:

```typescript
import {
  Navigation,
  Hero,
  PainPoints,
  Solution,
  Features,
  HowItWorks,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing'

export default function Home() {
  return (
    <main className="bg-dark-900">
      <Navigation />
      <Hero />
      <PainPoints />
      <Solution />
      <Features />
      <HowItWorks />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}
```

**Step 3: Commit page assembly**

```bash
git add components/landing/index.ts app/page.tsx
git commit -m "feat(landing): assemble complete landing page"
```

---

## Task 12: Mobile Navigation Menu

**Files:**
- Modify: `components/landing/navigation.tsx`

**Step 1: Add mobile menu state and drawer**

Replace `components/landing/navigation.tsx` with:

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-dark-900/95 backdrop-blur-sm border-b border-dark-600' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-white">Subscription Incinerator</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-gray-300 hover:text-fire-400 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="px-4 py-2 bg-fire-500 hover:bg-fire-600 text-white rounded-lg transition-colors"
              >
                Login
              </Link>
            </div>

            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-dark-900/95 backdrop-blur-sm border-b border-dark-600"
          >
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-gray-300 hover:text-fire-400 transition-colors py-2"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-3 bg-fire-500 hover:bg-fire-600 text-white rounded-lg transition-colors"
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

**Step 2: Commit mobile menu**

```bash
git add components/landing/navigation.tsx
git commit -m "feat(landing): add mobile navigation menu"
```

---

## Task 13: Final Testing and Polish

**Step 1: Run the development server**

```bash
npm run dev
```

**Step 2: Test the landing page**

- Open http://localhost:3000 in browser
- Verify all sections render
- Test smooth scroll navigation
- Test mobile responsiveness (resize browser)
- Test hover effects on cards
- Verify animations play smoothly

**Step 3: Run linter**

```bash
npm run lint
```

Fix any lint errors that appear.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(landing): complete landing page implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Setup - Dependencies & Theme | package.json, tailwind.config.ts, globals.css |
| 2 | Navigation Component | components/landing/navigation.tsx |
| 3 | Hero Section | components/landing/hero.tsx |
| 4 | Pain Points Section | components/landing/pain-points.tsx |
| 5 | Solution Section | components/landing/solution.tsx |
| 6 | Features Grid | components/landing/features.tsx |
| 7 | How It Works Section | components/landing/how-it-works.tsx |
| 8 | FAQ Section | components/landing/faq.tsx |
| 9 | Final CTA Section | components/landing/final-cta.tsx |
| 10 | Footer Component | components/landing/footer.tsx |
| 11 | Barrel Export & Page Assembly | components/landing/index.ts, app/page.tsx |
| 12 | Mobile Navigation Menu | components/landing/navigation.tsx |
| 13 | Final Testing & Polish | - |

Total: 13 tasks, ~11 new files, ~45 minutes estimated implementation time.
