export interface EmailTemplate {
  subject: string
  body: string
}

export const emailTemplates = {
  // Signup (Activation)
  welcome: (userName: string): EmailTemplate => ({
    subject: `🔥 Welcome to Subscription Incinerator, ${userName}!`,
    body: `
      Hey ${userName},

      You're in. Time to find out what's quietly draining your bank account every month.

      Head to your dashboard and run your first scan:
      https://subscriptionincinerator.app/dashboard

      Most people find at least one subscription they forgot they were even paying for. Let's go burn it.

      - Pax the Koala 🐨
        Subscription Incinerator
    `,
  }),

  // Day 90: The Quarterly Audit (Retention)
  quarterlyAuditReminder: (userName: string): EmailTemplate => ({
    subject: `🕒 Time for your 90-day Subscription Audit, ${userName}!`,
    body: `
      Hey ${userName},

      It's been 90 days since your last full scan. Statistics show the average user adds 1.2 new subscriptions every quarter without realising it.

      Don't let them turn into "Subscription Tax." Run your 10-minute checklist now:
      https://subscriptionincinerator.app/blog/subscription-audit-checklist

      Or, jump straight to your dashboard to auto-scan your latest receipts:
      https://subscriptionincinerator.app/dashboard

      Let's keep your bank account clean.

      - Pax the Koala 🐨
        Subscription Incinerator
    `,
  }),

  // Savings Milestone (Engagement)
  savingsMilestone: (userName: string, amountSaved: string): EmailTemplate => ({
    subject: `🔥 Boom! You've just incinerated ${amountSaved} in waste.`,
    body: `
      Nice work, ${userName}!

      By cancelling those subscriptions, you've officially saved ${amountSaved} this year. That's money back in your pocket for things you actually care about.

      Know someone else who is overpaying for Netflix or Adobe? Share the "Incinerator" and help them save too:
      https://subscriptionincinerator.app/

      Keep up the great work.

      - Pax the Koala 🐨
        Subscription Incinerator
    `,
  }),
}
