# Organic Marketing Buildout — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build all code-deliverable items from the organic marketing strategy: SEO schema, trust signals, social proof, blog infrastructure, cancellation guides, lead capture, and supporting pages — then rebuild and deploy Docker image.

**Architecture:** Pure Next.js App Router TSX pages. No new dependencies. Blog posts as static TSX pages (no MDX needed). Cancellation guides as a dynamic `/cancel/[slug]` route with a static data file. All new pages use the existing dark landing page design system (bg-dark-900, fire-500 accent, framer-motion animations).

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion (already installed), Resend (for /free-checklist email capture, already configured)

---

## Task 1: JSON-LD Schema Markup

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**What to build:**
Add two JSON-LD scripts to the homepage:
1. `SoftwareApplication` schema — tells Google this is a free finance app
2. `FAQPage` schema — enables FAQ rich results in search (use the same 5 Qs from `components/landing/faq.tsx`)

Add to `app/layout.tsx` metadata:
```tsx
export const metadata: Metadata = {
  // existing fields +
  other: {
    'application-name': 'Subscription Incinerator',
  },
}
```

Add to `app/page.tsx` — inject two `<Script>` tags with `type="application/ld+json"`:

```tsx
import Script from 'next/script'

// SoftwareApplication schema
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Subscription Incinerator",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": [
    { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
    { "@type": "Offer", "price": "9", "priceCurrency": "USD", "name": "Premium", "billingIncrement": "P1M" }
  ],
  "description": "Track and cancel forgotten subscriptions. Automatically finds trials and recurring charges.",
  "url": "https://subscriptionincinerator.app"
}

// FAQPage schema (5 questions matching faq.tsx content)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Is it really free?", "acceptedAnswer": { "@type": "Answer", "text": "The core features are completely free — track subscriptions, get reminders, and manage your spending at no cost. We also offer an optional premium tier with advanced features like Gmail scanning and bank statement import." }},
    { "@type": "Question", "name": "Is my data safe?", "acceptedAnswer": { "@type": "Answer", "text": "We only request read-only access to your Gmail — we can't send emails or modify anything. Your bank statements are processed locally and we only store the subscription data you approve. We never sell your data." }},
    { "@type": "Question", "name": "What if you miss a subscription?", "acceptedAnswer": { "@type": "Answer", "text": "No detection is perfect. You can always add subscriptions manually, and our pending review system lets you approve or dismiss anything we find. You're always in control." }},
    { "@type": "Question", "name": "Which email providers do you support?", "acceptedAnswer": { "@type": "Answer", "text": "Currently Gmail only. Outlook and other providers are on our roadmap." }},
    { "@type": "Question", "name": "Can you cancel subscriptions for me?", "acceptedAnswer": { "@type": "Answer", "text": "Not yet — we provide step-by-step instructions to help you cancel yourself. Automated cancellation is coming in a future update." }}
  ]
}
```

**Steps:**
1. Open `app/page.tsx`, import `Script` from `'next/script'`
2. Add both JSON-LD `<Script>` blocks inside `<main>` before `<Navigation />`
3. Commit: `feat: add JSON-LD schema markup for SEO rich results`

---

## Task 2: Fix Hero Currency + Add "Works Worldwide" Badge

**Files:**
- Modify: `components/landing/hero.tsx`

**What to build:**
- Change the three hero mockup prices from `£9.99/mo`, `£10.99/mo`, `£54.99/mo` to `$9.99/mo`, `$10.99/mo`, `$54.99/mo`
- Add a small badge below the CTA buttons: 🌍 Works worldwide — GBP, USD, EUR & more

Badge HTML (insert after the two CTA buttons div):
```tsx
<p className="mt-4 text-sm text-gray-500">
  🌍 Works worldwide — GBP, USD, EUR & more
</p>
```

**Steps:**
1. Edit `components/landing/hero.tsx` — replace 3 × `£` with `$`
2. Add the worldwide badge paragraph after the button group div
3. Commit: `fix: use USD in hero mockup, add worldwide currency badge`

---

## Task 3: Security Trust Bar Component

**Files:**
- Create: `components/landing/trust-bar.tsx`
- Modify: `components/landing/index.ts` (add export)
- Modify: `app/page.tsx` (insert TrustBar after Features)

**What to build:**
A horizontal bar with 4 trust signals, dark background, fire accent icons:

```tsx
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
```

**Steps:**
1. Create `components/landing/trust-bar.tsx` with the above
2. Check `components/landing/index.ts` — add `export { TrustBar } from './trust-bar'`
3. In `app/page.tsx` import TrustBar, insert `<TrustBar />` between `<Features />` and `<HowItWorks />`
4. Commit: `feat: add security trust bar after features section`

---

## Task 4: Social Proof / Testimonials Section

**Files:**
- Create: `components/landing/testimonials.tsx`
- Modify: `components/landing/index.ts`
- Modify: `app/page.tsx` (insert Testimonials before FinalCTA)

**What to build:**
A testimonials section with 3 placeholder-but-realistic testimonials (with a note in code comments that these should be replaced with real user quotes). Include a "Total saved" stat bar at the top.

```tsx
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
```

**Steps:**
1. Create `components/landing/testimonials.tsx`
2. Export from `components/landing/index.ts`
3. Import + insert `<Testimonials />` in `app/page.tsx` after `<FAQ />`, before `<FinalCTA />`
4. Commit: `feat: add social proof testimonials section`

---

## Task 5: Improve Pricing Page Copy

**Files:**
- Modify: `components/landing/pricing.tsx` (need to read this file first)

**What to build:**
- Add above the pricing cards: *"The average person wastes $273/year on forgotten subscriptions. Premium pays for itself the day you find your first forgotten charge."*
- Reframe each premium bullet as an outcome, not a feature
- Add a FAQ-like objection block below pricing: "Why not just use a spreadsheet?" / "Is the free plan actually free?"

**Steps:**
1. Read `components/landing/pricing.tsx` first
2. Add the urgency stat paragraph above the pricing grid
3. Change premium feature labels to outcome-led descriptions
4. Add 2-item mini-FAQ below pricing
5. Commit: `feat: improve pricing page copy with outcomes and urgency`

---

## Task 6: Blog Infrastructure + 3 Posts

**Files:**
- Create: `app/blog/page.tsx` — blog index listing all posts
- Create: `app/blog/[slug]/page.tsx` — dynamic post page
- Create: `lib/blog/posts.ts` — post metadata registry
- Create: `app/blog/how-to-find-all-subscriptions/page.tsx`
- Create: `app/blog/free-trial-trap/page.tsx`
- Create: `app/blog/subscription-audit-checklist/page.tsx`

**Architecture:**
Each blog post is a plain Next.js page (no MDX). Posts are registered in `lib/blog/posts.ts` with metadata (title, slug, description, date, readTime). The `/blog/[slug]/page.tsx` dynamic route catches all slugs and redirects to the static page (or 404s). Actually, simpler: just create individual static pages under `/app/blog/` and list them manually in `lib/blog/posts.ts` for the index page.

**`lib/blog/posts.ts`:**
```ts
export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  category: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-find-all-subscriptions',
    title: 'How to Find Every Subscription Billing You Right Now (2026 Guide)',
    description: 'A step-by-step guide to finding every recurring charge — in your email, bank statements, PayPal, Apple, Google, and credit cards.',
    date: '2026-04-04',
    readTime: '7 min read',
    category: 'Guides',
  },
  {
    slug: 'free-trial-trap',
    title: 'The Free Trial Trap: 7 Subscriptions That Auto-Charge Without Warning',
    description: "Free trials are designed to convert. Here's how the most common services make it hard to cancel — and how to stay ahead of the charge.",
    date: '2026-04-04',
    readTime: '5 min read',
    category: 'Money Tips',
  },
  {
    slug: 'subscription-audit-checklist',
    title: 'The Subscription Audit: A 10-Minute Checklist to Find Hidden Charges',
    description: 'Run through this checklist once a quarter and you\'ll never be surprised by a subscription charge again.',
    date: '2026-04-04',
    readTime: '4 min read',
    category: 'Guides',
  },
]
```

**Blog layout shared wrapper** (`app/blog/layout.tsx`):
```tsx
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-dark-900 min-h-screen">
      <Navigation />
      <div className="pt-16">
        {children}
      </div>
      <Footer />
    </div>
  )
}
```

**Blog index** (`app/blog/page.tsx`):
- Grid of post cards using `blogPosts` array
- Each card: title, description, date, readTime, category tag, "Read →" link
- Page metadata: title "Blog — Subscription Incinerator", description "Tips, guides, and insights on managing and cancelling subscriptions"

**Each post page structure:**
```tsx
export const metadata = { title: '...', description: '...' }

export default function PostName() {
  return (
    <article className="max-w-2xl mx-auto px-4 py-16">
      <header className="mb-12">
        <span className="text-fire-500 text-sm font-medium">Category</span>
        <h1 className="text-4xl font-bold text-white mt-2 mb-4">Title</h1>
        <p className="text-gray-400">Date · Read time</p>
      </header>
      <div className="prose prose-invert prose-fire max-w-none">
        {/* Full article content as JSX */}
      </div>
      <div className="mt-12 p-6 bg-dark-700 rounded-xl border border-fire-500/30 text-center">
        <p className="text-white font-semibold mb-2">Stop tracking manually</p>
        <p className="text-gray-400 text-sm mb-4">Subscription Incinerator finds and tracks all of this automatically — free.</p>
        <a href="/login" className="inline-flex px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors">
          Start Free →
        </a>
      </div>
    </article>
  )
}
```

**Post 1: `how-to-find-all-subscriptions`** — ~1,200 words covering:
- Check your email inbox (Gmail search: `receipt OR invoice OR subscription OR "your subscription"`)
- Check your bank statement (sort by amount, look for same-amount recurring charges)
- Check PayPal recurring payments
- Check Apple subscriptions (Settings > Apple ID > Subscriptions)
- Check Google Play subscriptions
- Check credit card statements separately from debit
- Check Amazon (Memberships & Subscriptions)
- What to do when you find them
- CTA to use Subscription Incinerator to automate all of this

**Post 2: `free-trial-trap`** — ~900 words covering:
- How free trials are designed (the psychology of forgetting)
- Netflix: how they handle trial-to-paid conversion
- Adobe Creative Cloud: 12-month commitment trap, cancellation fee
- Duolingo Plus: quiet auto-renewal
- Amazon Prime: how it bundles services to make cancellation feel like loss
- Audible: credits that expire if you cancel
- Apple One: multiple services make it hard to untangle
- How to protect yourself (reminder before trial end, use Subscription Incinerator)

**Post 3: `subscription-audit-checklist`** — ~700 words covering:
- The 10-step quarterly audit (each step is one location to check)
- How to decide what to keep vs cancel (last used? value vs cost?)
- The "one month rule" for keeping subscriptions
- CTA

**Steps:**
1. Create `lib/blog/posts.ts`
2. Create `app/blog/layout.tsx`
3. Create `app/blog/page.tsx` (index)
4. Create `app/blog/how-to-find-all-subscriptions/page.tsx` (full 1200 word article)
5. Create `app/blog/free-trial-trap/page.tsx` (full 900 word article)
6. Create `app/blog/subscription-audit-checklist/page.tsx` (full 700 word article)
7. Update Navigation to include "Blog" link
8. Commit: `feat: add blog infrastructure with 3 SEO articles`

---

## Task 7: Cancellation Guides Directory (/cancel)

**Files:**
- Create: `lib/cancel/services.ts` — all service data
- Create: `app/cancel/page.tsx` — directory index page
- Create: `app/cancel/layout.tsx` — shared layout
- Create: `app/cancel/[slug]/page.tsx` — dynamic cancellation guide page
- Create: `app/cancel/[slug]/generateStaticParams.ts` — for static export

**Architecture:**
Single dynamic route `/cancel/[slug]` using `generateStaticParams()` to pre-render all guides at build time. Service data lives in `lib/cancel/services.ts`.

**`lib/cancel/services.ts`** — define 12 services:

```ts
export type CancellationService = {
  slug: string
  name: string
  logo: string // emoji
  color: string // Tailwind bg class
  monthlyPrice: string
  annualCost: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  difficultyReason: string
  steps: string[]
  warnings: string[]
  alternatives?: string
  directCancelUrl?: string
}

export const cancellationServices: CancellationService[] = [
  {
    slug: 'netflix',
    name: 'Netflix',
    logo: '🎬',
    color: 'bg-red-700',
    monthlyPrice: '$15.49/mo',
    annualCost: '$185.88/yr',
    difficulty: 'Easy',
    difficultyReason: 'Netflix makes cancellation straightforward — no phone call required.',
    steps: [
      'Go to netflix.com and sign in to your account',
      'Click your profile icon in the top right corner',
      'Select "Account" from the dropdown menu',
      'Scroll down to the "Membership" section',
      'Click "Cancel Membership"',
      'Click "Finish Cancellation" to confirm',
      'You\'ll keep access until the end of your current billing period',
    ],
    warnings: [
      'Netflix will keep you subscribed until the end of your paid period — you won\'t get a refund',
      'Your watch history and profiles are saved for 10 months if you resubscribe',
      'If you were on a promotional price, you may lose it if you resubscribe',
    ],
    directCancelUrl: 'https://www.netflix.com/cancel',
  },
  // ... add Spotify, Adobe CC, Apple Music, Disney+, Amazon Prime, YouTube Premium, Duolingo Plus, Audible, Apple One, Hulu, Canva Pro
]
```

**Dynamic page `/cancel/[slug]/page.tsx`:**
- Header: service name + logo + difficulty badge + monthly cost + annual cost
- "Why People Forget to Cancel" — one sentence about this specific service
- Direct cancel link button (if available)
- Step-by-step numbered guide
- Warnings section
- "Don't forget to cancel manually" → CTA to track it in Subscription Incinerator
- Related cancellation guides (3 other services)

**Directory index `/cancel/page.tsx`:**
- Hero: "How to Cancel Any Subscription — Step by Step"
- Grid of all 12 service cards with difficulty badge, price, "View Guide →" link
- CTA to track subscriptions with SI

**Steps:**
1. Create `lib/cancel/services.ts` with all 12 services fully populated
2. Create `app/cancel/layout.tsx`
3. Create `app/cancel/page.tsx` (directory)
4. Create `app/cancel/[slug]/page.tsx` (dynamic guide)
5. Update Navigation to link to `/cancel` under "Features" or as a standalone nav item
6. Commit: `feat: add cancellation guides directory for 12 services`

---

## Task 8: Free Checklist Lead Magnet Page

**Files:**
- Create: `app/free-checklist/page.tsx`
- Create: `app/api/email/checklist-signup/route.ts`

**What to build:**
A standalone lead capture page for "The Subscription Audit Checklist" — a free PDF/resource that people get via email. Captures email + sends confirmation via Resend.

**Page content:**
- Hero: "Get the Free Subscription Audit Checklist"
- Subheadline: "10 places hidden subscriptions are quietly billing you — check them off one by one"
- What's inside: 5 bullet points
- Email capture form (email input + "Send My Checklist" button)
- Privacy note: "No spam. Unsubscribe anytime."

**API route** — accepts `{ email }`, sends a Resend email with the checklist content embedded directly in the email (no PDF needed for v1):

**Steps:**
1. Create `app/free-checklist/page.tsx` with the form UI (client component)
2. Create `app/api/email/checklist-signup/route.ts` using existing Resend setup
3. Commit: `feat: add free checklist lead magnet page with email capture`

---

## Task 9: About / Founder Story Page

**Files:**
- Create: `app/about/page.tsx`

**What to build:**
A simple, personal founder story page that builds trust:
- "Why I Built This" — personal story about discovering forgotten subscriptions
- What the tool does
- Current stats (users, subscriptions tracked, money saved)
- The team (just the founder, honestly stated)
- Link to try the free tool

**Steps:**
1. Create `app/about/page.tsx` with full content
2. Add "About" to Footer links
3. Commit: `feat: add founder story about page`

---

## Task 10: Resources Hub Page

**Files:**
- Create: `app/resources/page.tsx`

**What to build:**
A link hub page that aggregates all free tools and guides:
- Free Tools: Subscription Audit Checklist (/free-checklist)
- Cancellation Guides: links to all 12 /cancel/[slug] pages
- Blog Posts: links to all 3 blog posts
- SEO value: this page gets linked to from blog posts and cancellation guides as a "see all resources" link

**Steps:**
1. Create `app/resources/page.tsx`
2. Add "Resources" to Navigation and Footer
3. Commit: `feat: add resources hub page linking all content`

---

## Task 11: Update Navigation + Footer Links

**Files:**
- Modify: `components/landing/navigation.tsx` (need to read first)
- Modify: `components/landing/footer.tsx` (need to read first)

**What to add to Navigation:**
- Blog
- Cancel Guide (→ /cancel)
- Resources

**What to add to Footer:**
- Blog, Resources, Cancel Guides, About — under a new "Content" column

**Steps:**
1. Read `components/landing/navigation.tsx`
2. Read `components/landing/footer.tsx`
3. Add new links to both
4. Commit: `feat: add blog, cancel guides, resources links to nav and footer`

---

## Task 12: Rebuild Docker Image + Deploy

**From:** `/opt/docker/subscription/`

```bash
docker compose build web
docker compose up -d web
```

Wait for health check, verify at http://127.0.0.1:3007

**Steps:**
1. Run `docker compose build web 2>&1 | tail -10` — watch for errors
2. Run `docker compose up -d web`
3. Wait 30 seconds, check `docker compose ps`
4. Curl health: `curl -s http://127.0.0.1:3007/api/health`

---

## Execution Order (Priority Ranked)

1. Task 1 — Schema markup (SEO, no visual change, zero risk)
2. Task 2 — Currency fix (quick trust fix)
3. Task 3 — Trust bar (trust signal)
4. Task 4 — Testimonials (social proof)
5. Task 5 — Pricing copy (conversion)
6. Task 7 — Cancellation guides (BIGGEST SEO opportunity)
7. Task 6 — Blog + 3 posts (long-term SEO)
8. Task 8 — Free checklist page (lead capture)
9. Task 9 — About page
10. Task 10 — Resources hub
11. Task 11 — Navigation/footer links
12. Task 12 — Build + Deploy
