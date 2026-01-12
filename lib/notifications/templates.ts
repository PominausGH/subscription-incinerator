import { Reminder, Subscription, User } from '@prisma/client'

export type ReminderWithRelations = Reminder & {
  subscription: Subscription & {
    user: User
  }
}

/**
 * Email template for trial ending reminders
 */
export function getTrialEndingEmailTemplate(reminder: ReminderWithRelations) {
  const { subscription } = reminder
  const daysUntilEnd = Math.ceil(
    (subscription.trialEndsAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const subject = `Trial ending soon: ${subscription.serviceName}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trial Ending Soon</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🔥 Trial Ending Soon
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #374151;">
                Hi ${subscription.user.name || 'there'},
              </p>

              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; margin: 24px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 16px; line-height: 24px; color: #991b1b; font-weight: 600;">
                  Your <strong>${subscription.serviceName}</strong> trial ends in <strong>${daysUntilEnd} ${daysUntilEnd === 1 ? 'day' : 'days'}</strong>!
                </p>
              </div>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #374151;">
                After your trial ends on <strong>${subscription.trialEndsAt!.toLocaleDateString()}</strong>, you'll be charged <strong>${subscription.currency} ${subscription.amount?.toString() || '0'}/${subscription.billingCycle || 'month'}</strong>.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #374151;">
                Don't want to continue? Cancel now to avoid charges.
              </p>

              <!-- Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <a href="${subscription.cancellationUrl || `${process.env.APP_URL}/dashboard`}" style="display: block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);">
                      Cancel ${subscription.serviceName}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${process.env.APP_URL}/dashboard" style="display: block; background-color: #f3f4f6; color: #374151; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                Sent by Subscription Incinerator
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Managing your subscriptions so you don't have to.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return { subject, html }
}

/**
 * Email template for upcoming billing reminders
 */
export function getBillingUpcomingEmailTemplate(reminder: ReminderWithRelations) {
  const { subscription } = reminder
  const daysUntilBilling = Math.ceil(
    (subscription.nextBillingDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const subject = `Upcoming charge: ${subscription.serviceName}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upcoming Billing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                💳 Upcoming Billing
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #374151;">
                Hi ${subscription.user.name || 'there'},
              </p>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 16px; line-height: 24px; color: #1e40af; font-weight: 600;">
                  Your <strong>${subscription.serviceName}</strong> subscription renews in <strong>${daysUntilBilling} ${daysUntilBilling === 1 ? 'day' : 'days'}</strong>.
                </p>
              </div>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #374151;">
                You'll be charged <strong>${subscription.currency} ${subscription.amount?.toString() || '0'}</strong> on <strong>${subscription.nextBillingDate!.toLocaleDateString()}</strong>.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #374151;">
                Want to cancel? You still have time to avoid the next charge.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${process.env.APP_URL}/dashboard" style="display: block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                Sent by Subscription Incinerator
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Managing your subscriptions so you don't have to.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return { subject, html }
}
