# Subscription Incinerator - Design Document

**Date:** 2026-01-12
**Status:** Draft
**Author:** Design Session

## Executive Summary

Subscription Incinerator is a freemium SaaS application that helps users track free trials and paid subscriptions, sends timely reminders before charges, and provides automated cancellation capabilities. The app addresses the common problem of forgotten trial cancellations that lead to unwanted charges.

**Target Market:** Reddit users and general consumers who struggle with subscription management
**Revenue Model:** $5-15/month premium tier
**Core Value Proposition:** Never get charged for a forgotten free trial again

---

## 1. High-Level Architecture

### System Components

The application consists of three main processes:

1. **Next.js Web Application** (`/app`, `/pages/api`)
   - Frontend: Dashboard, subscription management UI, settings
   - API Routes: User auth, CRUD operations, OAuth callbacks, payment processing
   - Deployed on Vercel

2. **Worker Process** (`/workers`)
   - Long-running Node.js process that consumes BullMQ jobs
   - Handles: email scanning, reminder dispatch, cancellation execution
   - Deployed on Railway/Render or VPS

3. **Shared Infrastructure**
   - PostgreSQL database (Supabase/Railway/Neon)
   - Redis instance (Upstash/Railway) for BullMQ job queue
   - Email service (SendGrid/Resend) for notifications
   - SMS service (Twilio) for paid tier alerts

### Job Flow

- Web app creates jobs (e.g., "scan inbox at 6am daily", "send reminder 24h before charge")
- BullMQ stores jobs in Redis with scheduling metadata
- Worker process picks up jobs, executes them, updates database
- Results flow back to web UI via database state changes

### Technology Stack

- **Frontend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js workers
- **Database:** PostgreSQL with Prisma ORM
- **Queue:** BullMQ + Redis
- **Auth:** NextAuth.js with OAuth2
- **Payments:** Stripe
- **Notifications:** Resend (email), Web Push API, Twilio (SMS)
- **Automation:** Puppeteer for browser automation

---

## 2. Database Schema

### Core Tables

```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  oauth_tokens JSONB, -- Encrypted Gmail/Outlook tokens
  email_provider VARCHAR(50), -- 'gmail', 'outlook', null
  tier VARCHAR(20) DEFAULT 'free', -- 'free', 'premium'
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR(255)
);

-- Subscription Tracking
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'trial', 'active', 'cancelled', 'expired'
  billing_cycle VARCHAR(50), -- 'monthly', 'yearly', 'custom'
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  trial_ends_at TIMESTAMP,
  next_billing_date TIMESTAMP,
  cancellation_url TEXT,
  auto_cancel_enabled BOOLEAN DEFAULT false,
  detected_from VARCHAR(50), -- 'email_scan', 'manual', 'api'
  raw_email_data JSONB,
  external_id VARCHAR(255), -- ID from service's API
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reminder Scheduling
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL, -- 'trial_ending', 'billing_upcoming', 'cancellation_failed'
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  channels_used TEXT[], -- ['email', 'push', 'sms']
  job_id VARCHAR(255), -- BullMQ job ID
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cancellation Tracking
CREATE TABLE cancellation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  method VARCHAR(50), -- 'api', 'automation', 'manual_script'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'requires_manual'
  error_message TEXT,
  credentials_used JSONB, -- Encrypted, temporary storage
  attempted_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Service Configuration Database
CREATE TABLE service_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(255) UNIQUE NOT NULL,
  has_api BOOLEAN DEFAULT false,
  api_endpoint TEXT,
  api_auth_type VARCHAR(50), -- 'oauth', 'api_key', 'none'
  login_url TEXT,
  cancellation_url TEXT,
  cancel_button_selector VARCHAR(255),
  confirm_selector VARCHAR(255),
  success_indicator VARCHAR(255),
  cancellation_instructions JSONB, -- Step-by-step manual guide
  email_patterns JSONB, -- Detection rules for inbox scanning
  logo_url TEXT,
  support_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Push Notification Subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint_data JSONB NOT NULL, -- Web Push subscription object
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS Usage Tracking (for billing)
CREATE TABLE sms_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES reminders(id),
  cost DECIMAL(10, 4), -- ~$0.0075 per SMS
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Detection Feedback (ML training data)
CREATE TABLE detection_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_data JSONB,
  detected_service VARCHAR(255),
  confidence DECIMAL(3, 2),
  user_confirmed BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status IN ('trial', 'active');
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX idx_reminders_subscription ON reminders(subscription_id);
CREATE INDEX idx_cancellation_subscription ON cancellation_attempts(subscription_id);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id, active);
```

---

## 3. Project Structure

```
subscription-incinerator/
├── app/                          # Next.js 13+ app directory
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── oauth/callback/       # OAuth redirect handler
│   ├── (dashboard)/
│   │   ├── dashboard/            # Main subscription list
│   │   ├── subscriptions/[id]/   # Individual subscription detail
│   │   ├── analytics/            # Spending insights
│   │   └── settings/             # User preferences
│   └── api/                      # API routes
│       ├── auth/
│       ├── subscriptions/        # CRUD endpoints
│       ├── oauth/                # Gmail/Outlook OAuth
│       ├── reminders/
│       ├── webhooks/             # Stripe, email providers
│       └── jobs/                 # Manual job triggers
│
├── lib/                          # Shared business logic
│   ├── db/
│   │   ├── client.ts             # Postgres connection
│   │   └── queries/              # Typed query functions
│   ├── email/
│   │   ├── scanner.ts            # Email parsing logic
│   │   ├── patterns.ts           # Subscription detection rules
│   │   └── providers/            # Gmail/Outlook API clients
│   ├── cancellation/
│   │   ├── api-clients/          # Netflix, Spotify API wrappers
│   │   ├── automation/           # Puppeteer scripts
│   │   └── script-generator.ts   # Manual instruction builder
│   ├── notifications/
│   │   ├── email.ts              # SendGrid/Resend
│   │   ├── push.ts               # Web push notifications
│   │   └── sms.ts                # Twilio integration
│   ├── queue/
│   │   ├── client.ts             # BullMQ connection setup
│   │   └── jobs.ts               # Job type definitions
│   ├── crypto.ts                 # Encryption utilities
│   └── types.ts                  # Shared TypeScript types
│
├── workers/                      # Background job processors
│   ├── index.ts                  # Main worker entry point
│   ├── processors/
│   │   ├── email-scanner.ts      # Scans inbox for new subscriptions
│   │   ├── reminder-sender.ts    # Dispatches notifications
│   │   └── cancellation.ts       # Executes auto-cancel
│   └── schedules.ts              # Cron-like recurring job setup
│
├── components/                   # React components
│   ├── subscription-card.tsx
│   ├── reminder-settings.tsx
│   ├── cancellation-wizard.tsx
│   └── ...
│
├── prisma/                       # Database ORM
│   ├── schema.prisma
│   └── migrations/
│
└── package.json
```

---

## 4. Job Queue Design & Workflows

### BullMQ Job Types

```typescript
// lib/queue/jobs.ts
export enum JobType {
  SCAN_USER_INBOX = 'scan_user_inbox',
  SEND_REMINDER = 'send_reminder',
  EXECUTE_CANCELLATION = 'execute_cancellation',
  REFRESH_OAUTH_TOKEN = 'refresh_oauth_token',
  ANALYZE_SPENDING = 'analyze_spending'
}

interface ScanInboxJob {
  userId: string;
  fullScan: boolean; // true = scan all, false = recent only
}

interface SendReminderJob {
  reminderId: string;
  channels: ('email' | 'push' | 'sms')[];
}

interface ExecuteCancellationJob {
  subscriptionId: string;
  method: 'api' | 'automation';
  userCredentials?: EncryptedCredentials;
}
```

### Queue Configuration

```typescript
// lib/queue/client.ts
const queues = {
  inbox: new Queue('inbox-scanning', {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    }
  }),
  reminders: new Queue('reminders', {
    defaultJobOptions: {
      attempts: 5, // Critical - must deliver
      removeOnComplete: 1000
    }
  }),
  cancellations: new Queue('cancellations', {
    defaultJobOptions: {
      attempts: 2,
      timeout: 60000 // 1 min max
    }
  })
};
```

### Key Workflows

**1. New User Signs Up:**
- User completes OAuth → Web app stores tokens
- Web app schedules recurring job: `SCAN_USER_INBOX` (daily at 6am)
- Worker processes first scan immediately

**2. Subscription Detected:**
- Worker finds trial signup email
- Creates `subscriptions` record with `trial_ends_at`
- Schedules `SEND_REMINDER` job for 24h, 3h, 1h before trial ends
- If auto-cancel enabled, schedules `EXECUTE_CANCELLATION` 1h before charge

**3. Reminder Time:**
- Worker picks up `SEND_REMINDER` job
- Checks user's tier and preferences
- Sends via email/push (free), adds SMS (premium)
- Updates `reminders` table with sent status

---

## 5. Authentication & OAuth Flow

### Authentication Stack

- NextAuth.js for user authentication
- Magic link + Google/GitHub social login
- JWT sessions stored in secure httpOnly cookies

### OAuth Flow for Email Access

```typescript
// app/api/oauth/gmail/route.ts
export async function GET(req: Request) {
  const userId = await getCurrentUserId(req);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/oauth/gmail/callback`
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state: userId
  });

  return Response.redirect(authUrl);
}

// app/api/oauth/gmail/callback/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  const { tokens } = await oauth2Client.getToken(code);

  const encryptedTokens = encrypt(JSON.stringify(tokens));
  await db.users.update({
    where: { id: userId },
    data: {
      oauth_tokens: encryptedTokens,
      email_provider: 'gmail'
    }
  });

  await queues.inbox.add('scan_user_inbox', { userId, fullScan: true });

  return Response.redirect('/dashboard?setup=complete');
}
```

### Security Measures

- OAuth scopes limited to read-only email access
- State parameter prevents CSRF attacks
- Tokens encrypted at rest with AES-256
- Rate limiting on OAuth endpoints
- Delete credentials immediately if user disconnects

---

## 6. Email Parsing & Subscription Detection

### Detection Strategy (Hybrid Approach)

**Three-Tier Detection:**

1. **Curated Pattern Database** - High confidence (95%+)
2. **Generic Keyword Matching** - Medium confidence (40-70%)
3. **User Feedback Loop** - Continuous improvement

### Detection Rules

```typescript
// lib/email/patterns.ts
interface DetectionRule {
  service: string;
  senderDomains: string[];
  subjectPatterns: RegExp[];
  bodyKeywords: string[];
  trialIndicators: string[];
  priceExtractor: RegExp;
  dateExtractor: RegExp;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    service: 'Netflix',
    senderDomains: ['netflix.com', 'email.netflix.com'],
    subjectPatterns: [/netflix.*membership/i, /welcome to netflix/i],
    bodyKeywords: ['monthly charge', 'subscription'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.\d{2})\/month/,
    dateExtractor: /on\s+(\w+\s+\d{1,2},\s+\d{4})/
  },
  // ... 50+ services pre-configured
];
```

### Processing Flow

```typescript
async function scanInbox(userId: string, fullScan: boolean) {
  const messages = await fetchGmailMessages(userId, {
    after: fullScan ? null : thirtyDaysAgo(),
    maxResults: fullScan ? 500 : 50
  });

  for (const msg of messages) {
    const detection = await detectSubscription(msg);

    if (detection.confidence > 0.7) {
      await createSubscription(userId, detection);
    } else if (detection.confidence > 0.4) {
      await createPendingSubscription(userId, detection);
    }
  }
}
```

### User Feedback Loop

- User confirms/rejects pending detections
- Positive feedback strengthens detection rules
- Negative feedback adjusts confidence thresholds
- Build ML training dataset for future improvements

---

## 7. Cancellation System

### Three-Tier Cancellation Strategy

1. **API Integration** (cleanest, most reliable)
2. **Browser Automation** (Puppeteer, requires credentials)
3. **Manual Script Generation** (fallback, always works)

### Implementation Flow

```typescript
async function executeCancellation(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId);
  const config = await getServiceConfig(subscription.service_name);

  // Try API first
  if (config.has_api) {
    try {
      return await cancelViaAPI(subscription, config);
    } catch (error) {
      logCancellationError(subscriptionId, 'api', error);
    }
  }

  // Try automation second
  if (config.automation_script) {
    try {
      return await cancelViaAutomation(subscription, config);
    } catch (error) {
      logCancellationError(subscriptionId, 'automation', error);
    }
  }

  // Generate manual instructions
  return await generateManualScript(subscription, config);
}
```

### API Integration Example

```typescript
async function cancelViaAPI(subscription: Subscription, config: ServiceConfig) {
  const response = await fetch(config.api_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAPIToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscription_id: subscription.external_id,
      cancel_at_period_end: true
    })
  });

  if (response.ok) {
    await updateSubscriptionStatus(subscription.id, 'cancelled');
    return { success: true, method: 'api' };
  }

  throw new Error(`API cancellation failed: ${response.statusText}`);
}
```

### Browser Automation

```typescript
async function cancelViaAutomation(subscription: Subscription, config: ServiceConfig) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const credentials = await requestUserCredentials(subscription);

    await page.goto(config.login_url);
    await page.type('#email', credentials.email);
    await page.type('#password', decrypt(credentials.password));
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    await page.goto(config.cancellation_url);
    await page.click(config.cancel_button_selector);
    await page.click(config.confirm_selector);
    await page.waitForSelector(config.success_indicator);

    await deleteTemporaryCredentials(credentials.id);
    await browser.close();

    return { success: true, method: 'automation' };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
```

### Manual Script Generation

```typescript
function generateManualScript(subscription: Subscription, config: ServiceConfig) {
  const steps = config.cancellation_instructions || [
    `Go to ${subscription.service_name} website`,
    'Log in to your account',
    'Navigate to Settings > Subscription',
    'Click "Cancel Subscription"',
    'Confirm cancellation'
  ];

  return {
    success: false,
    method: 'manual',
    script: {
      service: subscription.service_name,
      estimatedTime: '5 minutes',
      steps: steps.map((step, idx) => ({
        number: idx + 1,
        instruction: step,
        completed: false
      })),
      helpfulLinks: [config.support_url, config.cancellation_url],
      tips: [
        'Take screenshots as proof',
        'Save confirmation numbers',
        'Check email for confirmation'
      ]
    }
  };
}
```

### Credential Handling

- Prompt user for credentials only when needed
- Encrypt immediately with user-specific key
- Store with TTL (auto-delete after 48h)
- Access only during cancellation attempt
- Delete immediately after use

---

## 8. Multi-Channel Notification System

### Notification Channels by Tier

| Channel | Free Tier | Premium Tier |
|---------|-----------|--------------|
| Email   | ✅        | ✅           |
| Push    | ✅        | ✅           |
| SMS     | ❌        | ✅           |

### Notification Dispatcher

```typescript
async function sendReminder(reminderId: string) {
  const reminder = await db.reminders.findUnique({
    where: { id: reminderId },
    include: { subscription: { include: { user: true } } }
  });

  const user = reminder.subscription.user;
  const channels = determineChannels(user.tier, user.notification_preferences);

  const results = await Promise.allSettled([
    channels.includes('email') ? sendEmail(reminder) : null,
    channels.includes('push') ? sendPush(reminder) : null,
    channels.includes('sms') ? sendSMS(reminder) : null
  ].filter(Boolean));

  await db.reminders.update({
    where: { id: reminderId },
    data: {
      sent_at: new Date(),
      channels_used: results
        .filter((r, idx) => r.status === 'fulfilled')
        .map((_, idx) => channels[idx]),
      status: results.some(r => r.status === 'fulfilled') ? 'sent' : 'failed'
    }
  });
}
```

### Email Notifications

**Provider:** Resend (modern, developer-friendly)

**Template Types:**
- Trial ending (24h, 3h, 1h before)
- Billing upcoming (7 days, 24h before)
- Cancellation failed (immediate)
- Weekly spending digest (optional)

**Email Content:**

```typescript
function renderTrialEndingEmail(subscription: Subscription): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🔥 Your trial is ending soon!</h2>
      <p>Your <strong>${subscription.service_name}</strong> free trial ends on
         <strong>${formatDate(subscription.trial_ends_at)}</strong>.</p>

      <p>You'll be charged <strong>$${subscription.amount}</strong> unless you cancel.</p>

      <div style="margin: 30px 0;">
        <a href="${APP_URL}/subscriptions/${subscription.id}/cancel"
           style="background: #dc2626; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px;">
          Cancel Now
        </a>
        <a href="${APP_URL}/subscriptions/${subscription.id}/keep"
           style="color: #6b7280; padding: 12px 24px; text-decoration: none;">
          Keep Subscription
        </a>
      </div>
    </div>
  `;
}
```

### Push Notifications (Web Push)

**Provider:** Web Push API (native browser support)

**Implementation:**
- Service worker registration in app
- VAPID keys for authentication
- Push subscription stored per device
- Supports notification actions (Cancel, View)

```typescript
const payload = {
  title: `${subscription.service_name} Reminder`,
  body: `Trial ends in ${getTimeRemaining(subscription.trial_ends_at)}. Cancel to avoid $${subscription.amount} charge.`,
  icon: '/icon-512.png',
  data: {
    url: `${APP_URL}/subscriptions/${subscription.id}`,
    subscription_id: subscription.id
  },
  actions: [
    { action: 'cancel', title: 'Cancel Subscription' },
    { action: 'view', title: 'View Details' }
  ]
};
```

### SMS Notifications (Premium)

**Provider:** Twilio

**Cost:** ~$0.0075 per SMS (tracked for billing)

**Message Format:**
- Keep under 160 characters
- Include shortened URL (bit.ly style)
- Use emojis for visual clarity
- Clear call-to-action

```typescript
function getSMSMessage(reminder: Reminder): string {
  const { subscription } = reminder;
  const shortUrl = generateShortUrl(subscription.id);

  return `🔥 ${subscription.service_name} trial ends in ${getTimeRemaining(subscription.trial_ends_at)}! Cancel now to avoid $${subscription.amount} charge: ${shortUrl}`;
}
```

### Reminder Scheduling

```typescript
async function scheduleTrialReminders(subscription: Subscription) {
  const trialEnd = subscription.trial_ends_at;

  const reminderTimes = [
    { offset: -24 * 60 * 60 * 1000, type: '24h' },
    { offset: -3 * 60 * 60 * 1000, type: '3h' },
    { offset: -1 * 60 * 60 * 1000, type: '1h' }
  ];

  for (const { offset, type } of reminderTimes) {
    const scheduledFor = new Date(trialEnd.getTime() + offset);

    if (scheduledFor > new Date()) {
      const reminder = await db.reminders.create({
        data: {
          subscription_id: subscription.id,
          reminder_type: 'trial_ending',
          scheduled_for: scheduledFor,
          status: 'pending'
        }
      });

      const job = await queues.reminders.add(
        'send_reminder',
        { reminderId: reminder.id },
        { delay: scheduledFor.getTime() - Date.now() }
      );

      await db.reminders.update({
        where: { id: reminder.id },
        data: { job_id: job.id }
      });
    }
  }
}
```

---

## 9. Error Handling & Recovery

### Error Categories

1. **Transient Errors** (retry automatically)
   - Network timeouts
   - Rate limits
   - Temporary API outages

2. **Permanent Errors** (don't retry, alert user)
   - Invalid OAuth tokens (require re-authorization)
   - Account not found
   - Service API deprecated

3. **Partial Failures** (log and continue)
   - Email sent but push failed
   - Some subscriptions detected, some missed

### Retry Strategy

```typescript
// lib/queue/client.ts
const retryConfig = {
  inbox: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  },
  reminders: {
    attempts: 5, // Critical - must deliver
    backoff: { type: 'fixed', delay: 5000 }
  },
  cancellations: {
    attempts: 2, // Don't retry too much
    backoff: { type: 'exponential', delay: 10000 }
  }
};
```

### Dead Letter Queue

```typescript
// Failed jobs after all retries
const failedQueue = new Queue('failed-jobs');

worker.on('failed', async (job, err) => {
  await failedQueue.add('manual-review', {
    originalJob: job.data,
    error: err.message,
    attempts: job.attemptsMade,
    timestamp: new Date()
  });

  // Alert user if critical (reminder failed)
  if (job.name === 'send_reminder') {
    await notifyUserOfFailure(job.data.reminderId);
  }
});
```

### Graceful Degradation

```typescript
// If email scanning fails, user can still manually add subscriptions
// If SMS fails, fall back to email + push
// If auto-cancel fails, provide manual instructions

async function handleCancellationFailure(subscription: Subscription, error: Error) {
  // Log error
  await db.cancellation_attempts.create({
    data: {
      subscription_id: subscription.id,
      status: 'failed',
      error_message: error.message,
      attempted_at: new Date()
    }
  });

  // Generate manual script
  const script = await generateManualScript(subscription);

  // Notify user
  await sendNotification(subscription.user_id, {
    type: 'cancellation_failed',
    subscription: subscription,
    manual_script: script
  });
}
```

### OAuth Token Refresh

```typescript
// Proactively refresh tokens before expiration
async function refreshOAuthToken(userId: string) {
  const user = await db.users.findUnique({ where: { id: userId } });
  const tokens = decrypt(user.oauth_tokens);

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    const { credentials } = await oauth2Client.refreshAccessToken();

    await db.users.update({
      where: { id: userId },
      data: { oauth_tokens: encrypt(JSON.stringify(credentials)) }
    });
  } catch (error) {
    // Token invalid - require re-authorization
    await db.users.update({
      where: { id: userId },
      data: { oauth_tokens: null, email_provider: null }
    });

    await sendReauthorizationEmail(userId);
  }
}
```

---

## 10. Testing Strategy

### Test Pyramid

```
                  /\
                 /  \
                / E2E \ (10%)
               /------\
              /        \
             /Integration\ (30%)
            /------------\
           /              \
          /     Unit        \ (60%)
         /------------------\
```

### Unit Tests

**Coverage:** Core business logic in `/lib`

```typescript
// lib/email/scanner.test.ts
describe('detectSubscription', () => {
  it('detects Netflix trial from email', () => {
    const email = mockNetflixTrialEmail();
    const detection = detectSubscription(email);

    expect(detection.service).toBe('Netflix');
    expect(detection.confidence).toBeGreaterThan(0.9);
    expect(detection.isTrial).toBe(true);
    expect(detection.amount).toBe(15.99);
  });

  it('handles unknown service with generic patterns', () => {
    const email = mockUnknownServiceEmail();
    const detection = detectSubscription(email);

    expect(detection.confidence).toBeLessThan(0.7);
  });
});

// lib/cancellation/script-generator.test.ts
describe('generateManualScript', () => {
  it('generates step-by-step instructions', () => {
    const subscription = mockSubscription({ service: 'Spotify' });
    const script = generateManualScript(subscription);

    expect(script.steps).toHaveLength(5);
    expect(script.helpfulLinks).toContain('spotify.com/support');
  });
});
```

### Integration Tests

**Coverage:** API routes, database queries, job processing

```typescript
// __tests__/api/subscriptions.test.ts
describe('POST /api/subscriptions', () => {
  it('creates subscription and schedules reminders', async () => {
    const user = await createTestUser();

    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Cookie': await getAuthCookie(user) },
      body: JSON.stringify({
        service_name: 'Netflix',
        trial_ends_at: addDays(new Date(), 7),
        amount: 15.99
      })
    });

    expect(response.status).toBe(201);

    // Check database
    const subscription = await db.subscriptions.findFirst({
      where: { user_id: user.id }
    });
    expect(subscription).toBeTruthy();

    // Check reminders scheduled
    const reminders = await db.reminders.findMany({
      where: { subscription_id: subscription.id }
    });
    expect(reminders).toHaveLength(3); // 24h, 3h, 1h
  });
});

// __tests__/workers/email-scanner.test.ts
describe('Email Scanner Worker', () => {
  it('processes inbox scan job', async () => {
    const user = await createTestUser({ oauth_tokens: mockGmailTokens() });

    // Mock Gmail API
    mockGmailAPI([
      mockNetflixTrialEmail(),
      mockSpotifySubscriptionEmail()
    ]);

    await processJob('scan_user_inbox', { userId: user.id, fullScan: true });

    const subscriptions = await db.subscriptions.findMany({
      where: { user_id: user.id }
    });
    expect(subscriptions).toHaveLength(2);
  });
});
```

### E2E Tests (Playwright)

**Coverage:** Critical user flows

```typescript
// e2e/trial-reminder-flow.spec.ts
test('user receives trial reminder and cancels subscription', async ({ page }) => {
  // Setup: User with trial ending tomorrow
  const user = await createTestUser();
  await createSubscription({
    user_id: user.id,
    service: 'Netflix',
    trial_ends_at: addDays(new Date(), 1)
  });

  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', user.email);
  await page.click('button[type="submit"]');

  // Check dashboard shows trial ending soon
  await page.goto('/dashboard');
  await expect(page.locator('.trial-ending-badge')).toBeVisible();

  // Click cancel
  await page.click('[data-testid="cancel-netflix"]');

  // Choose cancellation method
  await page.click('[data-testid="auto-cancel"]');

  // Verify cancellation scheduled
  await expect(page.locator('.cancellation-scheduled')).toBeVisible();
});
```

### Load Testing

**Tool:** Artillery / k6

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/second
    - duration: 120
      arrivalRate: 50  # Ramp to 50 users/second

scenarios:
  - name: Dashboard Load
    flow:
      - post:
          url: "/api/auth/signin"
          json:
            email: "test@example.com"
      - get:
          url: "/dashboard"
      - get:
          url: "/api/subscriptions"
```

---

## 11. Deployment & Infrastructure

### Production Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                       │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel (Next.js Web App)                   │
│  - Auto-scaling                                         │
│  - Edge functions                                       │
│  - API routes                                           │
└───────────────────────────┬─────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   Railway        │ │  Supabase    │ │   Upstash    │
│   (Workers)      │ │  (Postgres)  │ │   (Redis)    │
│  - BullMQ        │ │  - Backups   │ │  - Durable   │
│  - Cron jobs     │ │  - Pooling   │ │  - Global    │
└──────────────────┘ └──────────────┘ └──────────────┘
          │
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              External Services                          │
│  - Resend (Email)                                       │
│  - Twilio (SMS)                                         │
│  - Stripe (Payments)                                    │
└─────────────────────────────────────────────────────────┘
```

### Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/actions/deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-workers:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railway/deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: workers
```

### Environment Variables

```bash
# .env.production
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."

# Notifications
RESEND_API_KEY="..."
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."

# Payments
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."

# Security
ENCRYPTION_KEY="..." # AES-256 key
JWT_SECRET="..."

# App
APP_URL="https://subincinerator.com"
NODE_ENV="production"
```

### Database Backups

```typescript
// Automated daily backups via Supabase
// Manual backup script for critical moments
async function createBackup() {
  const timestamp = new Date().toISOString();
  await exec(`pg_dump ${DATABASE_URL} > backups/backup-${timestamp}.sql`);

  // Upload to S3
  await uploadToS3(`backups/backup-${timestamp}.sql`);
}
```

### Monitoring & Alerts

**Tools:**
- Vercel Analytics (frontend performance)
- Railway Logs (worker logs)
- Sentry (error tracking)
- BetterStack (uptime monitoring)
- Supabase Metrics (database performance)

**Critical Alerts:**
- Worker process down (page immediately)
- Database connection pool exhausted
- Reminder job failed 5+ times
- OAuth token refresh failures spike
- Email/SMS delivery rate < 95%

---

## 12. Security Considerations

### OWASP Top 10 Protections

1. **Injection Prevention**
   - Prisma ORM (parameterized queries)
   - Input validation with Zod schemas
   - Content Security Policy headers

2. **Authentication**
   - NextAuth.js with secure session handling
   - httpOnly cookies
   - CSRF tokens
   - Rate limiting on auth endpoints (10 attempts/hour)

3. **Sensitive Data**
   - OAuth tokens encrypted at rest (AES-256)
   - User credentials never stored (except temporary, encrypted)
   - PII encrypted in database
   - No sensitive data in logs

4. **XML External Entities (XXE)**
   - Not applicable (no XML parsing)

5. **Broken Access Control**
   - Row-level security with user_id checks
   - Middleware validates ownership
   - No direct object references

6. **Security Misconfiguration**
   - Security headers (Helmet.js)
   - Disable X-Powered-By
   - HTTPS only
   - Secure cookie flags

7. **XSS**
   - React auto-escapes by default
   - DOMPurify for user-generated content
   - Content Security Policy

8. **Insecure Deserialization**
   - JSON only
   - Schema validation before processing

9. **Components with Known Vulnerabilities**
   - Dependabot automatic updates
   - npm audit in CI/CD
   - Lock file committed

10. **Insufficient Logging**
    - All auth attempts logged
    - Failed job attempts logged
    - Suspicious activity logged
    - PII excluded from logs

### Data Encryption

```typescript
// lib/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}
```

---

## 13. Performance & Scaling

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load (dashboard) | < 1.5s | Lighthouse |
| API response time (p95) | < 200ms | Vercel Analytics |
| Email scan job | < 30s | BullMQ metrics |
| Database query (p95) | < 50ms | Supabase metrics |
| Reminder delivery | < 5s | Custom tracking |

### Optimization Strategies

**Frontend:**
- Next.js Image optimization
- Route-based code splitting
- React Server Components for static content
- Incremental Static Regeneration for dashboard
- Service Worker for offline support

**Backend:**
- Database connection pooling (PgBouncer)
- Query optimization with indexes
- Redis caching for service configs
- Batch operations for bulk email processing

**Database:**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status) WHERE status IN ('trial', 'active');
CREATE INDEX idx_reminders_pending_scheduled ON reminders(scheduled_for, status) WHERE status = 'pending';

-- Partial indexes for hot data
CREATE INDEX idx_active_trials ON subscriptions(trial_ends_at) WHERE status = 'trial' AND trial_ends_at > NOW();
```

### Scaling Strategy

**Phase 1: 0-1,000 users**
- Single worker instance
- Shared database
- Current architecture sufficient

**Phase 2: 1,000-10,000 users**
- Multiple worker instances (horizontal scaling)
- Database read replicas
- Redis cluster for job queue
- CDN for static assets

**Phase 3: 10,000+ users**
- Worker specialization (dedicated email scanners, reminder senders)
- Database sharding by user_id
- Separate Redis for caching vs job queue
- Consider microservices for email scanning

### Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Cache service configs (rarely change)
async function getServiceConfig(serviceName: string) {
  const cacheKey = `service:${serviceName}`;
  const cached = await redis.get(cacheKey);

  if (cached) return cached;

  const config = await db.service_configs.findUnique({
    where: { service_name: serviceName }
  });

  await redis.set(cacheKey, config, { ex: 3600 }); // 1 hour TTL

  return config;
}

// Cache user preferences
async function getUserPreferences(userId: string) {
  const cacheKey = `user:${userId}:prefs`;
  const cached = await redis.get(cacheKey);

  if (cached) return cached;

  const prefs = await db.users.findUnique({
    where: { id: userId },
    select: { notification_preferences: true, tier: true }
  });

  await redis.set(cacheKey, prefs, { ex: 300 }); // 5 min TTL

  return prefs;
}
```

---

## 14. Cost Analysis & Unit Economics

### Infrastructure Costs (Monthly)

| Service | Plan | Cost | Scales With |
|---------|------|------|-------------|
| Vercel | Pro | $20 | Bandwidth |
| Railway | Hobby | $5 + usage | Worker hours |
| Supabase | Pro | $25 | Storage, connections |
| Upstash Redis | Pay-as-you-go | ~$10 | Commands |
| Resend | Growth | $20 (50k emails) | Email volume |
| Twilio SMS | Pay-as-you-go | Variable | Premium users |
| Stripe | 2.9% + $0.30 | Variable | Revenue |
| Domain | Namecheap | $12/year | Fixed |
| **Total Fixed** | | **~$100/mo** | |

### Variable Costs per User

**Free Tier User:**
- Email scanning: $0.001/day (Gmail API reads)
- Email reminders: $0.0004/email × 3 emails = $0.0012
- Push notifications: Free
- Database storage: $0.10/month
- **Total: ~$0.13/user/month**

**Premium Tier User ($10/month):**
- All free tier costs: $0.13
- SMS reminders: $0.0075 × 3 SMS = $0.0225
- Browser automation: $0.10 (Puppeteer instance)
- **Total: ~$0.25/user/month**

### Unit Economics

**Break-even Analysis:**

| Tier | Price | Variable Cost | Gross Margin | Users Needed to Cover Fixed Costs |
|------|-------|---------------|--------------|-----------------------------------|
| Free | $0 | $0.13 | -$0.13 | ∞ |
| Premium | $10 | $0.25 | $9.75 | 11 users |

**Revenue Projections:**

| Users | Free | Premium (20% conversion) | MRR | Costs | Profit |
|-------|------|--------------------------|-----|-------|--------|
| 100 | 80 | 20 | $200 | $115 | $85 |
| 1,000 | 800 | 200 | $2,000 | $354 | $1,646 |
| 10,000 | 8,000 | 2,000 | $20,000 | $2,540 | $17,460 |

**Key Metrics:**
- Break-even: 11 premium users (~55 total at 20% conversion)
- LTV:CAC target: 3:1
- Churn target: < 5% monthly
- Conversion rate target: 15-25% free to premium

---

## 15. MVP Roadmap & Implementation Phases

### Phase 1: Core MVP (Weeks 1-4)

**Goal:** Launch with manual entry + email reminders

**Features:**
- ✅ User authentication (NextAuth + magic link)
- ✅ Manual subscription entry
- ✅ Basic dashboard (list subscriptions)
- ✅ Email reminder system (24h before trial ends)
- ✅ Manual cancellation instructions
- ✅ PostgreSQL database setup
- ✅ BullMQ job queue
- ✅ Stripe payment integration (premium tier)

**Deliverable:** Working app where users can manually track subscriptions and get email reminders

**Success Metrics:**
- 50 signups
- 10 premium conversions
- 90% email delivery rate

---

### Phase 2: Gmail Integration (Weeks 5-6)

**Goal:** Automate subscription detection

**Features:**
- ✅ Gmail OAuth integration
- ✅ Email parsing with curated patterns (top 20 services)
- ✅ Daily inbox scanning job
- ✅ Pending subscription confirmation UI
- ✅ User feedback loop

**Deliverable:** Users can connect Gmail and have subscriptions auto-detected

**Success Metrics:**
- 70% detection accuracy
- 50% of users connect email
- 30% reduction in manual entries

---

### Phase 3: Multi-Channel Notifications (Weeks 7-8)

**Goal:** Add push + SMS notifications

**Features:**
- ✅ Web push notifications
- ✅ SMS notifications (premium only)
- ✅ Notification preferences UI
- ✅ Multiple reminder times (24h, 3h, 1h)

**Deliverable:** Premium users get SMS alerts, all users get push

**Success Metrics:**
- 60% push opt-in rate
- 40% SMS opt-in (premium)
- 95% notification delivery

---

### Phase 4: Auto-Cancellation (Weeks 9-12)

**Goal:** Implement automated cancellation

**Features:**
- ✅ API integration for 5 major services (Netflix, Spotify, etc.)
- ✅ Puppeteer browser automation framework
- ✅ Credential collection + encryption
- ✅ Cancellation attempt tracking
- ✅ Manual script fallback

**Deliverable:** Premium users can enable auto-cancel for major services

**Success Metrics:**
- 80% API cancellation success rate
- 60% automation success rate
- 100% manual script fallback

---

### Phase 5: Analytics & Polish (Weeks 13-16)

**Goal:** Add spending insights and polish UX

**Features:**
- ✅ Spending dashboard (monthly/yearly totals)
- ✅ Subscription categorization
- ✅ Savings calculator
- ✅ Export data (CSV/JSON)
- ✅ Mobile responsive design
- ✅ Onboarding flow improvements
- ✅ Help documentation

**Deliverable:** Full-featured product ready for growth

**Success Metrics:**
- < 2s dashboard load time
- 80% mobile usage
- 25% free-to-premium conversion

---

### Post-MVP: Growth Features

**Future Enhancements:**
- Outlook email support
- Chrome extension (detect signups in real-time)
- Shared family accounts
- Subscription recommendations
- Price drop alerts
- Bill negotiation service
- iOS/Android native apps
- Slack/Discord integrations
- API for developers

---

## 16. Risk Analysis & Mitigation

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gmail API rate limits | High | Medium | Implement exponential backoff, batch requests, cache aggressively |
| Browser automation breaks | High | High | Maintain library of selectors, fallback to manual scripts, version control automation scripts |
| Database performance degrades | Medium | Low | Index optimization, connection pooling, read replicas |
| Worker process crashes | High | Medium | Health checks, auto-restart, dead letter queue |
| OAuth token revocation | Medium | Medium | Graceful degradation, prompt for re-auth, clear error messages |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low conversion rate | High | Medium | Free trial of premium features, clear value prop, testimonials |
| High churn | High | Medium | Regular engagement emails, demonstrate savings, improve UX |
| Competition (Truebill, Rocket Money) | High | High | Focus on trial cancellation niche, better UX, lower price |
| Privacy concerns | Medium | Medium | Transparent data practices, read-only access, encryption |
| Legal issues (ToS violations) | High | Low | Legal review, conservative approach, clear disclaimers |

### Compliance Considerations

- **GDPR** (EU users): Right to deletion, data export, consent management
- **CCPA** (California): Data sale opt-out, privacy policy
- **PCI DSS**: Stripe handles card data (no PCI compliance needed)
- **CAN-SPAM**: Unsubscribe links in all emails
- **TCPA**: SMS opt-in required, clear consent

---

## Conclusion

Subscription Incinerator solves a real pain point (forgotten trial cancellations) with a clear value proposition and sustainable business model. The architecture balances simplicity for rapid MVP development with flexibility to scale as the user base grows.

**Key Success Factors:**
1. Reliable email detection (must work seamlessly)
2. Timely notifications (can't miss reminders)
3. Easy cancellation (reduce friction)
4. Clear premium value (SMS + auto-cancel justifies $10/month)

**Next Steps:**
1. Set up development environment
2. Initialize Git repository
3. Create Prisma schema
4. Build authentication flow
5. Implement manual subscription entry
6. Set up job queue
7. Build email notification system
8. Deploy MVP to production

**Go-to-Market:**
1. Reddit posts in r/personalfinance, r/frugal
2. Product Hunt launch
3. Content marketing (blog: "I analyzed 1000 free trials...")
4. SEO for "cancel [service] free trial"
5. Referral program

---

**Document Version:** 1.0
**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
