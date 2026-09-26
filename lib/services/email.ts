import nodemailer from 'nodemailer'
import { emailTemplates, EmailTemplate } from '@/lib/email/templates'
import { unsubscribeUrl } from '@/lib/email/unsubscribe'

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
})

export class EmailService {
  private static instance: EmailService

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  /**
   * Send a template-based email via Brevo SMTP.
   */
  public async sendTemplateEmail(
    to: string,
    template: EmailTemplate,
    headers?: Record<string, string>
  ): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Subscription Incinerator <noreply@subscriptionincinerator.app>',
        to,
        subject: template.subject,
        text: template.body,
        ...(headers ? { headers } : {}),
      })
      return true
    } catch (err) {
      console.error('[EmailService] Failed to send email:', err)
      return false
    }
  }

  /**
   * Welcome email sent on account registration
   */
  public async sendWelcome(userEmail: string, userName: string) {
    const template = emailTemplates.welcome(userName)
    return this.sendTemplateEmail(userEmail, template)
  }

  /**
   * Nudge sent to signups who haven't added any subscription yet.
   * Includes a signed one-click unsubscribe link (honoured via EmailUnsubscribe).
   */
  public async sendActivationNudge(userEmail: string, userName: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://subscriptionincinerator.app'
    const unsubUrl = unsubscribeUrl(userEmail, baseUrl)
    const template = emailTemplates.activationNudge(userName, unsubUrl)
    return this.sendTemplateEmail(userEmail, template, {
      'List-Unsubscribe': `<${unsubUrl}>, <mailto:unsubscribe@subscriptionincinerator.app>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    })
  }

  /**
   * Automate the Quarterly Audit Reminder
   */
  public async scheduleQuarterlyAudit(userEmail: string, userName: string) {
    const template = emailTemplates.quarterlyAuditReminder(userName)
    return this.sendTemplateEmail(userEmail, template)
  }

  /**
   * Automate Savings Milestone Celebrate
   */
  public async celebrateSavings(userEmail: string, userName: string, amount: string) {
    const template = emailTemplates.savingsMilestone(userName, amount)
    return this.sendTemplateEmail(userEmail, template)
  }
}

export const emailService = EmailService.getInstance()
