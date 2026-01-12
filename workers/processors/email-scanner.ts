import { Job } from 'bullmq'
import { ScanInboxJob } from '@/lib/queue/jobs'
import { db } from '@/lib/db/client'
import { createGmailClient, fetchGmailMessages } from '@/lib/email/gmail-client'
import { detectSubscription, deduplicateDetections } from '@/lib/email/scanner'
import { scheduleTrialReminders, scheduleBillingReminders } from '@/lib/notifications/schedule-reminders'

export async function processScanJob(job: Job<ScanInboxJob>) {
  const { userId, fullScan } = job.data

  console.log(`Processing scan job for user ${userId}, fullScan: ${fullScan}`)

  try {
    // Get user with OAuth tokens
    console.log('Step 1: Fetching user from database...')
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.oauthTokens) {
      throw new Error('User not found or Gmail not connected')
    }
    console.log('✓ User found')

    const tokens = user.oauthTokens as any

    // Create Gmail client
    console.log('Step 2: Creating Gmail client...')
    const oauth2Client = createGmailClient(tokens.accessToken, tokens.refreshToken)
    console.log('✓ Gmail client created')

    // Determine date range
    const afterDate = new Date()
    afterDate.setDate(afterDate.getDate() - (fullScan ? 90 : 30))
    console.log(`Step 3: Fetching messages after ${afterDate.toISOString()}...`)

    // Fetch messages
    const messages = await fetchGmailMessages(oauth2Client, {
      maxResults: fullScan ? 500 : 100,
      afterDate,
    })
    console.log(`✓ Fetched ${messages.length} messages`)

    console.log(`Fetched ${messages.length} messages for user ${userId}`)

    // Detect subscriptions
    const detections = messages
      .map(msg => detectSubscription(msg))
      .filter(d => d !== null) as any[]

    console.log(`Found ${detections.length} potential subscriptions`)

    // Deduplicate
    const uniqueDetections = deduplicateDetections(detections)

    // Check for existing subscriptions to avoid duplicates
    const existingSubscriptions = await db.subscription.findMany({
      where: { userId },
      select: { serviceName: true, amount: true },
    })

    const existingKeys = new Set(
      existingSubscriptions.map(s => `${s.serviceName}-${s.amount}`)
    )

    let createdCount = 0
    let pendingCount = 0

    for (const detection of uniqueDetections) {
      const key = `${detection.service}-${detection.amount}`

      // Skip if already exists
      if (existingKeys.has(key)) {
        continue
      }

      // High confidence - auto-create
      if (detection.confidence >= 0.8) {
        const subscription = await db.subscription.create({
          data: {
            userId,
            serviceName: detection.service,
            status: detection.isTrial ? 'trial' : 'active',
            amount: detection.amount,
            currency: detection.currency,
            trialEndsAt: detection.trialEndsAt,
            nextBillingDate: detection.nextBillingDate,
            detectedFrom: 'email_scan',
            rawEmailData: detection.rawData,
          },
        })

        // Schedule reminders
        try {
          if (subscription.trialEndsAt) {
            await scheduleTrialReminders(subscription)
          }
          if (subscription.nextBillingDate) {
            await scheduleBillingReminders(subscription)
          }
        } catch (error) {
          console.error('Failed to schedule reminders:', error)
          // Don't fail the job if reminder scheduling fails
        }

        createdCount++
      } else if (detection.confidence >= 0.4) {
        // Medium confidence (40-80%) - create pending for review
        const existingPending = await db.pendingSubscription.findFirst({
          where: {
            userId,
            emailId: detection.rawData.emailId,
            status: 'pending'
          }
        })

        if (!existingPending) {
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

          await db.pendingSubscription.create({
            data: {
              userId,
              serviceName: detection.service,
              confidence: detection.confidence,
              amount: detection.amount,
              currency: detection.currency,
              isTrial: detection.isTrial,
              trialEndsAt: detection.trialEndsAt,
              nextBillingDate: detection.nextBillingDate,
              emailId: detection.rawData.emailId,
              emailSubject: detection.rawData.subject,
              emailFrom: detection.rawData.from,
              emailDate: detection.rawData.date,
              rawEmailData: detection.rawData,
              expiresAt
            }
          })
          pendingCount++
        }
      }
    }

    console.log(`Scan complete for user ${userId}: ${createdCount} auto-created, ${pendingCount} pending review`)

    return {
      messagesScanned: messages.length,
      detectionsFound: detections.length,
      subscriptionsCreated: createdCount,
      subscriptionsPending: pendingCount,
    }
  } catch (error) {
    console.error('Scan job error:', error)
    throw error
  }
}
