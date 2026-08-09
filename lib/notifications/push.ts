import webpush from 'web-push'

// Configure VAPID
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    'mailto:support@subincinerator.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<void> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (error: any) {
    // Handle expired subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      throw new Error('SUBSCRIPTION_EXPIRED')
    }
    throw error
  }
}

export function generateVapidKeys() {
  return webpush.generateVAPIDKeys()
}
