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
