import nodemailer from 'nodemailer'
import { Reminder, Subscription, User } from '@prisma/client'
import {
  getTrialEndingEmailTemplate,
  getBillingUpcomingEmailTemplate,
  getHouseholdInviteEmailTemplate,
  getPasswordResetEmailTemplate,
} from './templates'

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
})

export type ReminderWithRelations = Reminder & {
  subscription: Subscription & {
    user: User
  }
}

/**
 * Send reminder email via Brevo SMTP
 */
export async function sendReminderEmail(reminder: ReminderWithRelations) {
  const { subscription } = reminder
  const { user } = subscription

  let template: { subject: string; html: string }

  switch (reminder.reminderType) {
    case 'trial_ending':
      template = getTrialEndingEmailTemplate(reminder)
      break
    case 'billing_upcoming':
      template = getBillingUpcomingEmailTemplate(reminder)
      break
    default:
      throw new Error(`Unknown reminder type: ${reminder.reminderType}`)
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Subscription Incinerator <noreply@subscriptionincinerator.app>',
    to: user.email,
    subject: template.subject,
    html: template.html,
  })
}

/**
 * Send a household invite email via Brevo SMTP
 */
export async function sendHouseholdInviteEmail(params: { toEmail: string; ownerEmail: string; token: string }) {
  const template = getHouseholdInviteEmailTemplate({ ownerEmail: params.ownerEmail, token: params.token })

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Subscription Incinerator <noreply@subscriptionincinerator.app>',
    to: params.toEmail,
    subject: template.subject,
    html: template.html,
  })
}

/**
 * Send a password reset email via Brevo SMTP
 */
export async function sendPasswordResetEmail(params: { toEmail: string; token: string }) {
  const template = getPasswordResetEmailTemplate({ token: params.token })

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Subscription Incinerator <noreply@subscriptionincinerator.app>',
    to: params.toEmail,
    subject: template.subject,
    html: template.html,
  })
}

/**
 * Alert the site admin when Stripe webhook processing fails (e.g. signature ok but
 * grant/entitlement logic threw). Best-effort: a failure here is logged but never
 * thrown, so it can't mask the original webhook error or break the webhook response.
 */
export async function sendWebhookFailureAlert(params: {
  eventType: string
  eventId: string
  error: unknown
  customerEmail?: string | null
}) {
  const { eventType, eventId, error, customerEmail } = params
  const adminEmail = process.env.ADMIN_EMAIL || 'genmailing@gmail.com'
  const errorDetail = error instanceof Error ? error.stack || error.message : String(error)

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Subscription Incinerator <noreply@subscriptionincinerator.app>',
      to: adminEmail,
      subject: 'subscription-incinerator webhook FAILED',
      text: [
        `Stripe event type: ${eventType}`,
        `Stripe event ID: ${eventId}`,
        `Customer email: ${customerEmail || 'unknown'}`,
        '',
        'Error:',
        errorDetail,
      ].join('\n'),
    })
  } catch (err) {
    console.error('[sendWebhookFailureAlert] Failed to send webhook failure alert email:', err)
  }
}
