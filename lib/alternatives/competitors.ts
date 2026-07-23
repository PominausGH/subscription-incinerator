export type ComparisonRow = {
  feature: string
  us: string
  them: string
  usWins: boolean
}

export type CompetitorAlternative = {
  slug: string
  competitorName: string
  metaTitle: string
  metaDescription: string
  intro: string
  isDefunct?: boolean
  defunctNote?: string
  comparisonRows: ComparisonRow[]
  whySwitch: string[]
  faq: { q: string; a: string }[]
}

export const competitorAlternatives: CompetitorAlternative[] = [
  {
    slug: 'rocket-money',
    competitorName: 'Rocket Money',
    metaTitle: 'Rocket Money Alternative — Track Subscriptions Without Bank Linking',
    metaDescription:
      'Looking for a Rocket Money alternative? Subscription Incinerator finds your subscriptions from Gmail receipts, not your bank feed — no linked accounts, no negotiation fees.',
    intro:
      "Rocket Money (formerly Truebill) is a full budgeting and bill-negotiation platform — subscription tracking is one piece of a much bigger app. If that's more than you want, or you'd rather not link your bank account to a third party, here's how we compare.",
    comparisonRows: [
      {
        feature: 'How it finds subscriptions',
        us: 'Scans Gmail receipts (read-only) — optional, not required',
        them: 'Links your bank/card accounts via Plaid and reads transaction history',
        usWins: true,
      },
      {
        feature: 'Bank account required',
        us: 'No — track manually, via Gmail, or CSV import',
        them: 'Yes, for automatic detection — it’s core to how the app works',
        usWins: true,
      },
      {
        feature: 'Pricing model',
        us: '$9/mo flat, or $50/yr — same price for everyone',
        them: 'Pay-what-you-want premium tier, commonly reported around $6–$12/mo',
        usWins: false,
      },
      {
        feature: 'Cancellation help',
        us: 'Free step-by-step guides for 40+ services — you stay in control',
        them: 'Concierge cancellation available; bill negotiation takes a cut of what it saves you',
        usWins: true,
      },
      {
        feature: 'Free tier',
        us: 'Track up to 10 subscriptions manually, forever, no card required',
        them: 'Free tier exists, but automatic detection needs a linked bank account',
        usWins: true,
      },
      {
        feature: 'Scope',
        us: 'Subscription tracking, that’s it',
        them: 'Full budgeting suite — net worth, credit monitoring, savings, bill negotiation',
        usWins: false,
      },
    ],
    whySwitch: [
      "You don't want a third-party app holding read/write access to your bank or credit card accounts.",
      "You just want subscriptions tracked — not a full budgeting and credit-monitoring platform.",
      "You'd rather cancel things yourself for free than pay a percentage of savings to a negotiation service.",
    ],
    faq: [
      {
        q: 'Is Rocket Money the same as Truebill?',
        a: 'Yes. Truebill was acquired by Rocket Companies in December 2021 and fully rebranded to Rocket Money in August 2022. If you used Truebill, your account is now Rocket Money.',
      },
      {
        q: 'Can Subscription Incinerator find subscriptions without my bank details?',
        a: "Yes — that's the core difference. We scan Gmail receipts with read-only access, or you can add subscriptions manually or import a bank CSV once. We never require an ongoing linked bank connection.",
      },
      {
        q: 'Does Subscription Incinerator negotiate bills for me?',
        a: "No. We focus on finding and cancelling subscriptions you don't want, for a flat price — we don't offer bill negotiation and don't take a cut of anything.",
      },
    ],
  },
  {
    slug: 'truebill',
    competitorName: 'Truebill',
    metaTitle: 'Truebill Alternative (Now Rocket Money)',
    metaDescription:
      'Truebill was rebranded to Rocket Money in 2022. If you’re looking for a lighter, bank-linking-free alternative to either, here’s how Subscription Incinerator compares.',
    intro:
      "If you're searching for Truebill, it doesn't exist under that name anymore — Rocket Companies rebranded it to Rocket Money in August 2022, after acquiring it in 2021. Everything below compares Subscription Incinerator to what Truebill actually is today.",
    isDefunct: true,
    defunctNote:
      'Truebill was acquired by Rocket Companies in December 2021 and fully rebranded to Rocket Money in August 2022. There is no separate "Truebill" app anymore — accounts and features carried over to Rocket Money.',
    comparisonRows: [
      {
        feature: 'How it finds subscriptions',
        us: 'Scans Gmail receipts (read-only) — optional, not required',
        them: 'Links your bank/card accounts via Plaid and reads transaction history',
        usWins: true,
      },
      {
        feature: 'Bank account required',
        us: 'No — track manually, via Gmail, or CSV import',
        them: 'Yes, for automatic detection',
        usWins: true,
      },
      {
        feature: 'Pricing model',
        us: '$9/mo flat, or $50/yr — same price for everyone',
        them: 'Pay-what-you-want premium tier, commonly reported around $6–$12/mo',
        usWins: false,
      },
      {
        feature: 'Cancellation help',
        us: 'Free step-by-step guides for 40+ services',
        them: 'Concierge cancellation available; bill negotiation takes a cut of savings',
        usWins: true,
      },
      {
        feature: 'Scope',
        us: 'Subscription tracking, that’s it',
        them: 'Full budgeting suite under the Rocket Money name',
        usWins: false,
      },
    ],
    whySwitch: [
      "You remember 'Truebill' and want the simple subscription-tracking experience, without the full budgeting platform it grew into.",
      "You don't want to link a bank account for something as simple as subscription tracking.",
      "You'd rather pay one flat price than a pay-what-you-want tier plus negotiation fees.",
    ],
    faq: [
      {
        q: 'What happened to Truebill?',
        a: 'Truebill was acquired by Rocket Companies (NYSE: RKT) in December 2021 and rebranded to Rocket Money in August 2022. If you had a Truebill account, it became a Rocket Money account automatically.',
      },
      {
        q: 'Is Subscription Incinerator a Truebill/Rocket Money clone?',
        a: "No — we're deliberately narrower. We only do subscription tracking, renewal reminders, and cancellation guidance, without the budgeting, credit monitoring, or bank-linking that Rocket Money is built around.",
      },
    ],
  },
  {
    slug: 'mint',
    competitorName: 'Mint',
    metaTitle: 'Mint Alternative — Subscription Tracking After Mint Shut Down',
    metaDescription:
      'Intuit shut down Mint in January 2024. If you just want the subscription-tracking piece back — without a full budgeting app or bank linking — here’s how Subscription Incinerator compares.',
    intro:
      "Intuit shut down Mint in January 2024 and pointed users to Credit Karma, which is built around credit monitoring, not subscription tracking. If Mint's subscription list was the part you actually used, here's a dedicated alternative for just that.",
    isDefunct: true,
    defunctNote:
      'Mint was discontinued by Intuit on January 1, 2024. Existing users were directed to migrate to Credit Karma, which has a different focus (credit score monitoring) and does not replicate Mint’s subscription-tracking view.',
    comparisonRows: [
      {
        feature: 'Status',
        us: 'Active',
        them: 'Discontinued January 2024',
        usWins: true,
      },
      {
        feature: 'Focus',
        us: 'Subscription tracking, renewal reminders, cancellation guidance',
        them: 'Was a full budgeting app; subscriptions were one view among many',
        usWins: true,
      },
      {
        feature: 'How it finds subscriptions',
        us: 'Scans Gmail receipts (read-only) — optional, not required',
        them: 'Required a linked bank/card account',
        usWins: true,
      },
      {
        feature: 'Bank account required',
        us: 'No — track manually, via Gmail, or CSV import',
        them: 'Yes',
        usWins: true,
      },
      {
        feature: 'Cost',
        us: 'Free for up to 10 subscriptions; $9/mo or $50/yr for full features',
        them: 'Was free, ad-supported',
        usWins: false,
      },
      {
        feature: 'Suggested successor',
        us: '—',
        them: 'Credit Karma (Intuit) — credit monitoring focus, not subscriptions',
        usWins: true,
      },
    ],
    whySwitch: [
      "Mint doesn't exist anymore, and its official successor isn't built for subscription tracking.",
      "You want a focused tool for subscriptions specifically, not a full budgeting suite to relearn.",
      "You'd rather not link a bank account just to see what's renewing next month.",
    ],
    faq: [
      {
        q: 'Why did Mint shut down?',
        a: 'Intuit discontinued Mint on January 1, 2024, consolidating its personal finance efforts into Credit Karma, which it also owns.',
      },
      {
        q: 'Does Credit Karma do what Mint did for subscriptions?',
        a: "Not really — Credit Karma is built around credit score monitoring and recommendations, not a dedicated subscription list with renewal reminders and cancellation guides.",
      },
      {
        q: 'Do I need to link my bank account like I did with Mint?',
        a: 'No. We can find subscriptions from Gmail receipts (read-only access) or you can add them manually — a linked bank account is optional, not required.',
      },
    ],
  },
]

export function getCompetitorAlternative(slug: string) {
  return competitorAlternatives.find((c) => c.slug === slug)
}
