import { Job } from 'bullmq'
import { ScanInboxJob } from '@/lib/queue/jobs'
import { db } from '@/lib/db/client'
import { createGmailClient, fetchGmailMessages } from '@/lib/email/gmail-client'
import { detectSubscription, deduplicateDetections, detectRecurringEmails } from '@/lib/email/scanner'
import { detectTrialAndRenewalNotices, NOTICE_SEARCH_QUERY } from '@/lib/email/notice-detector'
import { scheduleTrialReminders, scheduleBillingReminders } from '@/lib/notifications/schedule-reminders'
import { decryptOAuthTokens, encryptOAuthTokens } from '@/lib/crypto'

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

    // Listen for token refresh events and persist them
    oauth2Client.on('tokens', async (newTokens) => {
      console.log('🔄 Gmail tokens refreshed, updating database...')
      try {
        const updatedEncryptedTokens = encryptOAuthTokens({
          accessToken: newTokens.access_token || tokens.accessToken,
          refreshToken: newTokens.refresh_token || tokens.refreshToken,
          expiryDate: newTokens.expiry_date,
          email: tokens.email, // Preserve the email if available
        })

        await db.user.update({
          where: { id: userId },
          data: { oauthTokens: updatedEncryptedTokens },
        })
        console.log('✓ Tokens updated successfully')
      } catch (err) {
        console.error('Failed to persist refreshed tokens:', err)
      }
    })
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

    // Fetch trial/renewal notice candidates — the default query above misses
    // plain renewal notices with no trial/billing/subscription/payment keyword
    const noticeMessages = await fetchGmailMessages(oauth2Client, {
      maxResults: fullScan ? 200 : 100,
      afterDate,
      query: NOTICE_SEARCH_QUERY,
    })
    console.log(`✓ Fetched ${noticeMessages.length} messages for notice detection`)

    // Merge and deduplicate by email ID
    const seenIds = new Set<string>()
    const messages = []
    for (const msg of [...subscriptionMessages, ...frequencyMessages, ...noticeMessages]) {
      if (!seenIds.has(msg.id)) {
        seenIds.add(msg.id)
        messages.push(msg)
      }
    }
    console.log(`✓ Total unique messages: ${messages.length}`)

    console.log(`Fetched ${messages.length} messages for user ${userId}`)

    // Detect subscriptions using pattern matching
    const patternDetections = messages
      .map(msg => detectSubscription(msg, user.homeCurrency))
      .filter(d => d !== null) as any[]

    console.log(`Found ${patternDetections.length} potential subscriptions via pattern matching`)

    // Detect subscriptions using frequency analysis (monthly recurring emails)
    const frequencyDetections = detectRecurringEmails(messages, user.homeCurrency)
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

    // Detect trial-ending / renewal-upcoming notices — always lands in
    // PendingSubscription for review, never auto-created (see notice-detector.ts)
    const noticeDetections = await detectTrialAndRenewalNotices(messages)
    console.log(`Found ${noticeDetections.length} potential trial/renewal notices`)

    let noticePendingCount = 0
    for (const notice of noticeDetections) {
      if (existingPendingEmails.has(notice.rawData.emailId)) {
        continue
      }

      // Skip if the user already has an active subscription tracking this merchant
      const alreadyTracked = existingSubscriptions.some(s => s.serviceName === notice.merchant)
      if (alreadyTracked) {
        continue
      }

      try {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        await db.pendingSubscription.create({
          data: {
            userId,
            serviceName: notice.merchant,
            confidence: notice.confidence,
            isTrial: notice.noticeType === 'trial_ending',
            trialEndsAt: notice.noticeType === 'trial_ending' ? notice.deadlineDate : null,
            nextBillingDate: notice.noticeType === 'renewal_upcoming' ? notice.deadlineDate : null,
            sourceType: 'notice',
            noticeType: notice.noticeType,
            emailId: notice.rawData.emailId,
            emailSubject: notice.rawData.subject,
            emailFrom: notice.rawData.from,
            emailDate: notice.rawData.date,
            rawEmailData: notice.rawData,
            expiresAt,
          },
        })
        noticePendingCount++
      } catch (error) {
        console.error(`Failed to create pending notice for ${notice.merchant}:`, error)
      }
    }

    console.log(`Scan complete for user ${userId}: ${createdCount} auto-created, ${pendingCount} pending review, ${noticePendingCount} notice pending review`)

    return {
      messagesScanned: messages.length,
      detectionsFound: allDetections.length,
      subscriptionsCreated: createdCount,
      subscriptionsPending: pendingCount,
      noticesPending: noticePendingCount,
    }
  } catch (error) {
    console.error('Scan job error:', error)

    const errData = (error as any)?.response?.data?.error ?? (error as any)?.cause?.message
    if (errData === 'invalid_grant') {
      console.warn(`Gmail refresh token revoked for user ${userId}, clearing stored tokens`)
      await db.user.update({
        where: { id: userId },
        data: { oauthTokens: null, emailProvider: null },
      })
    }

    throw error
  }
}
