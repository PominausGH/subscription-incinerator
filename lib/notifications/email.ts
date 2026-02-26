import { Resend } from 'resend'
import { Reminder, Subscription, User } from '@prisma/client'
import {
  getTrialEndingEmailTemplate,
  getBillingUpcomingEmailTemplate,
} from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export type ReminderWithRelations = Reminder & {
  subscription: Subscription & {
    user: User
  }
}

/**
 * Send reminder email via Resend
 */
export async function sendReminderEmail(reminder: ReminderWithRelations) {
  const { subscription } = reminder
  const { user } = subscription

  // Get template based on reminder type
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

  // Send email
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Subscription Incinerator <noreply@subscriptionincinerator.app>',
    to: user.email,
    subject: template.subject,
    html: template.html,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}
