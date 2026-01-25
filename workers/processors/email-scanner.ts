import { Job } from 'bullmq'
import { ScanInboxJob } from '@/lib/queue/jobs'
import { db } from '@/lib/db/client'
import { createGmailClient, fetchGmailMessages } from '@/lib/email/gmail-client'
import { detectSubscription, deduplicateDetections, detectRecurringEmails } from '@/lib/email/scanner'
import { scheduleTrialReminders, scheduleBillingReminders } from '@/lib/notifications/schedule-reminders'
import { decryptOAuthTokens } from '@/lib/crypto'

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

    // Decrypt OAuth tokens
    const tokens = decryptOAuthTokens(user.oauthTokens as string)

    // Create Gmail client
    console.log('Step 2: Creating Gmail client...')
    const oauth2Client = createGmailClient(tokens.accessToken, tokens.refreshToken)
    console.log('✓ Gmail client created')

    // Determine date range
    const afterDate = new Date()
    afterDate.setDate(afterDate.getDate() - (fullScan ? 90 : 30))
    console.log(`Step 3: Fetching messages after ${afterDate.toISOString()}...`)

    // Fetch subscription-related messages (pattern matching)
    const subscriptionMessages = await fetchGmailMessages(oauth2Client, {
      maxResults: fullScan ? 500 : 100,
      afterDate,
    })
    console.log(`✓ Fetched ${subscriptionMessages.length} subscription-related messages`)

    // Fetch broader set for frequency analysis (receipts, invoices, confirmations)
    const frequencyDate = new Date()
    frequencyDate.setDate(frequencyDate.getDate() - (fullScan ? 180 : 90)) // Longer range for frequency detection

    const frequencyMessages = await fetchGmailMessages(oauth2Client, {
      maxResults: fullScan ? 300 : 150,
      afterDate: frequencyDate,
      query: 'from:noreply OR from:no-reply OR from:billing OR from:receipts OR from:invoice OR subject:receipt OR subject:invoice OR subject:payment OR subject:confirmation OR subject:"your order"',
    })
    console.log(`✓ Fetched ${frequencyMessages.length} messages for frequency analysis`)

    // Merge and deduplicate by email ID
    const seenIds = new Set<string>()
    const messages = []
    for (const msg of [...subscriptionMessages, ...frequencyMessages]) {
      if (!seenIds.has(msg.id)) {
        seenIds.add(msg.id)
        messages.push(msg)
      }
    }
    console.log(`✓ Total unique messages: ${messages.length}`)

    console.log(`Fetched ${messages.length} messages for user ${userId}`)

    // Detect subscriptions using pattern matching
    const patternDetections = messages
      .map(msg => detectSubscription(msg))
      .filter(d => d !== null) as any[]

    console.log(`Found ${patternDetections.length} potential subscriptions via pattern matching`)

    // Detect subscriptions using frequency analysis (monthly recurring emails)
    const frequencyDetections = detectRecurringEmails(messages)
    console.log(`Found ${frequencyDetections.length} potential subscriptions via frequency analysis`)

    // Merge both detection methods
    const allDetections = [...patternDetections, ...frequencyDetections]
    console.log(`Total: ${allDetections.length} potential subscriptions`)

    // Deduplicate
    const uniqueDetections = deduplicateDetections(allDetections)

    // Check for existing subscriptions to avoid duplicates
    const existingSubscriptions = await db.subscription.findMany({
      where: { userId },
      select: { serviceName: true, amount: true },
    })

    const existingKeys = new Set(
      existingSubscriptions.map(s => `${s.serviceName}-${s.amount}`)
    )

    // Fetch existing pending subscriptions upfront to avoid N+1 queries
    const existingPending = await db.pendingSubscription.findMany({
      where: { userId, status: 'pending' },
      select: { emailId: true, serviceName: true, amount: true },
    })

    const existingPendingEmails = new Set(existingPending.map(p => p.emailId))
    const existingPendingKeys = new Set(
      existingPending.map(p => `${p.serviceName}-${p.amount}`)
    )

    let createdCount = 0
    let pendingCount = 0

    for (const detection of uniqueDetections) {
      const key = `${detection.service}-${detection.amount}`

      // Skip if already exists OR is pending
      if (existingKeys.has(key) || existingPendingKeys.has(key)) {
        continue
      }

      // High confidence - auto-create
      if (detection.confidence >= 0.8) {
        const subscription = await db.subscription.create({
          data: {
            userId,
            serviceName: detection.service,
            status: detection.isTrial ? 'trial' : 'active',
            billingCycle: detection.billingCycle,
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
        // Skip if already exists by emailId
        if (existingPendingEmails.has(detection.rawData.emailId)) {
          console.log(`Skipping duplicate pending for email ${detection.rawData.emailId}`)
          continue
        }

        try {
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

          await db.pendingSubscription.create({
            data: {
              userId,
              serviceName: detection.service,
              confidence: detection.confidence,
              amount: detection.amount,
              currency: detection.currency,
              billingCycle: detection.billingCycle,
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
        } catch (error) {
          console.error(`Failed to create pending subscription for ${detection.service}:`, error)
          // Continue processing other detections
        }
      }
    }

    console.log(`Scan complete for user ${userId}: ${createdCount} auto-created, ${pendingCount} pending review`)

    return {
      messagesScanned: messages.length,
      detectionsFound: allDetections.length,
      subscriptionsCreated: createdCount,
      subscriptionsPending: pendingCount,
    }
  } catch (error) {
    console.error('Scan job error:', error)
    throw error
  }
}
