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

      The fastest way to start: add the first subscription you can think of — Netflix, a gym, a software trial. It takes about 30 seconds and it's free:
      https://subscriptionincinerator.app/dashboard

      Once it's in, we'll remind you before it renews so nothing charges you by surprise. Not sure how to cancel one? Our step-by-step guides are here:
      https://subscriptionincinerator.app/cancel

      (Automatic Gmail scanning is part of Premium. Manual tracking, reminders and cancellation guides are free.)

      - Pax the Koala 🐨
        Subscription Incinerator
    `,
  }),

  // Day 2-14, no subscriptions added yet (Activation)
  activationNudge: (userName: string, unsubscribeUrl: string): EmailTemplate => ({
    subject: 'Add your first subscription (takes 30 seconds)',
    body: `
      Hey ${userName},

      You signed up a few days ago but haven't added a subscription yet, so there's nothing for us to keep an eye on.

      The easiest start is one you already know about: a streaming service, a gym, a software trial. All we need is the name, the amount and the renewal date:
      https://subscriptionincinerator.app/dashboard

      Then we'll remind you before it renews. If you've already decided to drop one, our guides walk you through cancelling it step by step:
      https://subscriptionincinerator.app/cancel

      - Pax the Koala 🐨
        Subscription Incinerator

      You're getting this because you created a Subscription Incinerator account. Don't want reminders like this? Unsubscribe: ${unsubscribeUrl}
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
