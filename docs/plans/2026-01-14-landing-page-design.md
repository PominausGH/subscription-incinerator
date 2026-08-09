# Landing Page Design

## Overview

Modern, dark-themed landing page with fire accents to match the "Incinerator" brand. Story-driven layout balancing conversion and education. Friendly, relatable copy tone.

## Visual Style

- **Theme:** Dark mode with gradients + fire/ember accents
- **Background:** Near-black to dark gray gradients
- **Accents:** Orange, amber, red fire tones
- **Effects:** Subtle ember particles, glow effects on hover, flame animations
- **Cards:** Dark with gradient borders, orange glow on hover

## Page Structure

1. Navigation (sticky)
2. Hero
3. Pain Points ("The Problem")
4. Solution Reveal
5. Features Grid (6 features)
6. How It Works (3 steps)
7. FAQ (5 questions)
8. Final CTA
9. Footer

---

## Section Details

### Navigation

- **Style:** Sticky, dark, transparent initially, solid on scroll
- **Items:** Features | How It Works | FAQ | Login
- **Logo:** Left-aligned with fire icon/emoji

### Hero

- **Layout:** Split - text left, app mockup right
- **Headline:** "Never Pay for a Forgotten Subscription Again"
- **Subheadline:** "We've all been there. That Netflix trial you meant to cancel. The gym membership you forgot about. Subscription Incinerator tracks them all and reminds you before you get charged."
- **CTA:** "Start Free" → /login
- **Visual:** Dashboard mockup with subtle fire reflection/glow effect, ember particles floating upward

### Pain Points

- **Section title:** "Sound Familiar?"
- **Layout:** 3 cards in a row

**Card 1:**
- Icon: Credit card with flames
- Title: "That £9.99 charge you didn't recognize"
- Text: "You signed up for a free trial 6 months ago. Now you've paid £60 for something you never used."

**Card 2:**
- Icon: Buried envelope
- Title: "The cancellation email you never sent"
- Text: "You meant to cancel before the trial ended. Life got busy. The charge hit anyway."

**Card 3:**
- Icon: Calendar/repeat
- Title: "Subscriptions multiplying quietly"
- Text: "Netflix, Spotify, that meditation app, the cloud storage... it adds up to hundreds per year."

### Solution Reveal

- **Headline:** "Burn the Subscriptions You Don't Need"
- **Subtext:** "Subscription Incinerator scans your emails and bank statements, finds every subscription, and reminds you before charges hit. Free."
- **Visual:** Animated subscription cards falling into flames or before/after comparison

### Features Grid

- **Section title:** "Everything You Need to Take Control"
- **Layout:** 2x3 grid

| Feature | Icon | Title | Description |
|---------|------|-------|-------------|
| Gmail Scanning | 📬 | Automatic Email Detection | Connect your Gmail and we'll find subscription receipts automatically. No manual entry needed. |
| Bank Import | 🏦 | Bank Statement Import | Upload a CSV and our AI spots recurring charges you might have missed. |
| Reminders | 🔔 | Never Miss a Trial Ending | Get reminded 24 hours, 3 hours, and 1 hour before your free trial converts to paid. |
| Cancellation | 🚪 | Step-by-Step Cancellation | Clear instructions for cancelling Netflix, Spotify, and 40+ other services. |
| Analytics | 📊 | See Where Your Money Goes | Monthly totals, category breakdowns, and your biggest subscription spenders. |
| Control | ✅ | You're in Control | We suggest subscriptions we find - you decide what to track. |

### How It Works

- **Section title:** "Get Started in 3 Steps"
- **Layout:** Horizontal 3-step flow with connecting flame trail

**Step 1:**
- Number: "01" with ember glow
- Title: "Sign Up Free"
- Text: "Create an account with just your email. No credit card, no commitment."

**Step 2:**
- Number: "02"
- Title: "Connect Your Sources"
- Text: "Link your Gmail for automatic detection, upload bank statements, or add subscriptions manually."

**Step 3:**
- Number: "03"
- Title: "Relax & Get Reminded"
- Text: "We'll alert you before trials end and charges hit. Cancel what you don't need."

**CTA:** "Ready to Take Control?" → "Start Free"

### FAQ

- **Section title:** "Questions? We've Got Answers"
- **Layout:** Accordion style

| Question | Answer |
|----------|--------|
| Is it really free? | Yes, completely free. No hidden charges, no premium tier required. We're building our user base and will add optional paid features later - but the core app will always be free. |
| Is my data safe? | We only request read-only access to your Gmail - we can't send emails or modify anything. Your bank statements are processed locally and we only store the subscription data you approve. We never sell your data. |
| What if you miss a subscription? | No detection is perfect. You can always add subscriptions manually, and our pending review system lets you approve or dismiss anything we find. You're always in control. |
| Which email providers do you support? | Currently Gmail only. Outlook and other providers are on our roadmap. |
| Can you cancel subscriptions for me? | Not yet - we provide step-by-step instructions to help you cancel yourself. Automated cancellation is coming in a future update. |

### Final CTA

- **Background:** Gradient with ember animation
- **Headline:** "Stop Paying for Subscriptions You Don't Use"
- **Button:** "Start Free - No Credit Card Required"

### Footer

- **Layout:** 3 columns, dark
- **Column 1:** Logo + "Never forget another subscription"
- **Column 2:** Features | How It Works | FAQ | Login
- **Column 3:** Privacy Policy | Terms | Contact
- **Bottom:** © 2026 Subscription Incinerator

---

## Technical Notes

- Built as replacement for current `app/page.tsx`
- Use Tailwind CSS for styling
- Consider Framer Motion for animations (ember particles, scroll effects)
- Smooth scroll to sections from nav links
- Mobile responsive - stack sections vertically on small screens

## Pricing

- Free only for now (no Stripe integration yet)
- No pricing section until payment system is built
