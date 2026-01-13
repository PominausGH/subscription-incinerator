# Bank Statement Import - Design Document

**Date:** 2026-01-13
**Status:** Draft
**Author:** Design Session

## Overview

Allow users to upload bank statement CSVs to discover subscriptions that weren't detected via email scanning.

**Key Decisions:**
- CSV upload first, Plaid integration later
- AI-assisted parsing for any bank format
- Hybrid approach: auto-detect recurring + manual selection
- Separate import review screen (not pending flow)
- Store raw data only for confirmed subscriptions
- Merchant matching: alias database + AI fallback
- Synchronous processing

---

## User Flow

```
Dashboard → "Import Bank Statement" button
    ↓
Upload CSV file
    ↓
AI parses CSV (any bank format)
    ↓
Review screen shows:
  - Auto-detected recurring charges (highlighted)
  - All other transactions (selectable)
    ↓
User confirms which are subscriptions
    ↓
Confirmed subscriptions added to dashboard
```

**Characteristics:**
- One-time bulk import (not continuous sync)
- Works with any bank's CSV format
- Privacy-focused: only stores data for confirmed subscriptions
- Complements email scanning, doesn't replace it

---

## Data Model

### New Tables

```prisma
model BankImport {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  fileName  String   @map("file_name")

  // Stats
  totalTransactions    Int @map("total_transactions")
  recurringDetected    Int @map("recurring_detected")
  subscriptionsCreated Int @map("subscriptions_created")

  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("bank_imports")
}

model MerchantAlias {
  id          String @id @default(uuid())
  bankPattern String @map("bank_pattern") // regex or exact match
  serviceName String @map("service_name")  // normalized name

  @@unique([bankPattern])
  @@map("merchant_aliases")
}
```

### Subscription Model Extension

```prisma
// Add to Subscription model
bankTransactionData Json? @map("bank_transaction_data")
// detectedFrom: add 'bank_import' as valid value
```

---

## API & Processing

### Endpoint

```
POST /api/bank-import
Content-Type: multipart/form-data
Body: { file: CSV }

Response: {
  importId: string,
  transactions: Transaction[],
  recurringGroups: RecurringGroup[]
}
```

### Processing Pipeline

```typescript
// lib/bank-import/processor.ts

async function processBankStatement(file: File, userId: string) {
  // 1. Parse CSV with AI
  const rawTransactions = await parseCSVWithAI(file);

  // 2. Normalize merchants
  const transactions = await normalizeMerchants(rawTransactions);

  // 3. Detect recurring patterns
  const recurringGroups = detectRecurringCharges(transactions);

  // 4. Return for user review (nothing saved yet)
  return { transactions, recurringGroups };
}
```

### AI CSV Parsing

```typescript
async function parseCSVWithAI(file: File): Promise<RawTransaction[]> {
  const content = await file.text();

  const response = await anthropic.messages.create({
    model: "claude-haiku", // fast & cheap
    messages: [{
      role: "user",
      content: `Parse this bank statement CSV. Extract transactions as JSON array with fields: date, description, amount (negative=debit), balance (if present).

CSV content:
${content.slice(0, 50000)} // limit size

Return only valid JSON array.`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

---

## Merchant Matching

### Two-Tier System

```typescript
// lib/bank-import/merchant-matcher.ts

async function normalizeMerchant(description: string): Promise<MerchantMatch> {
  // Tier 1: Check alias database (fast, free)
  const alias = await findMerchantAlias(description);
  if (alias) {
    return { serviceName: alias.serviceName, confidence: 0.95, source: 'alias_db' };
  }

  // Tier 2: AI fallback (slower, costs ~$0.001 per call)
  return await matchWithAI(description);
}
```

### Alias Database Matching

```typescript
async function findMerchantAlias(description: string): Promise<MerchantAlias | null> {
  const normalized = description.toUpperCase().trim();

  // Exact match first
  const exact = await prisma.merchantAlias.findFirst({
    where: { bankPattern: normalized }
  });
  if (exact) return exact;

  // Pattern match (e.g., "NETFLIX%" matches "NETFLIX.COM 800-585")
  const aliases = await prisma.merchantAlias.findMany();
  for (const alias of aliases) {
    if (alias.bankPattern.includes('*')) {
      const regex = new RegExp(alias.bankPattern.replace(/\*/g, '.*'), 'i');
      if (regex.test(normalized)) return alias;
    }
  }

  return null;
}
```

### AI Fallback

```typescript
async function matchWithAI(description: string): Promise<MerchantMatch> {
  const response = await anthropic.messages.create({
    model: "claude-haiku",
    messages: [{
      role: "user",
      content: `Bank transaction: "${description}"

What subscription service is this? Return JSON:
{"serviceName": "Name or null", "confidence": 0.0-1.0}

Common examples: NETFLIX.COM = Netflix, SPOTIFY USA = Spotify, AMZN PRIME = Amazon Prime.
If not a recognizable subscription service, return serviceName: null.`
    }]
  });

  const result = JSON.parse(response.content[0].text);
  return { ...result, source: 'ai' };
}
```

### Seed Data

```typescript
const INITIAL_ALIASES = [
  { bankPattern: 'NETFLIX*', serviceName: 'Netflix' },
  { bankPattern: 'SPOTIFY*', serviceName: 'Spotify' },
  { bankPattern: 'AMAZON PRIME*', serviceName: 'Amazon Prime' },
  { bankPattern: 'AMZN PRIME*', serviceName: 'Amazon Prime' },
  { bankPattern: 'APPLE.COM/BILL', serviceName: 'Apple Services' },
  { bankPattern: 'HULU*', serviceName: 'Hulu' },
  { bankPattern: 'HBO MAX*', serviceName: 'HBO Max' },
  { bankPattern: 'DISNEY PLUS*', serviceName: 'Disney+' },
  { bankPattern: 'DROPBOX*', serviceName: 'Dropbox' },
  { bankPattern: 'GITHUB*', serviceName: 'GitHub' },
  // ... expand to 50+ common services
];
```

---

## Recurring Detection Algorithm

```typescript
// lib/bank-import/recurring-detector.ts

interface RecurringGroup {
  merchantName: string;
  serviceName: string;
  transactions: Transaction[];
  amount: number;
  billingCycle: 'weekly' | 'monthly' | 'yearly' | 'unknown';
  confidence: number;
}

function detectRecurringCharges(transactions: Transaction[]): RecurringGroup[] {
  // Group transactions by normalized merchant
  const groups = groupByMerchant(transactions);

  const recurring: RecurringGroup[] = [];

  for (const [merchant, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue; // Need 2+ to detect pattern

    const analysis = analyzePattern(txns);

    if (analysis.isRecurring) {
      recurring.push({
        merchantName: merchant,
        serviceName: txns[0].serviceName,
        transactions: txns,
        amount: analysis.typicalAmount,
        billingCycle: analysis.cycle,
        confidence: analysis.confidence
      });
    }
  }

  return recurring.sort((a, b) => b.confidence - a.confidence);
}

function analyzePattern(txns: Transaction[]): PatternAnalysis {
  // Sort by date
  const sorted = txns.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Check amount consistency
  const amounts = sorted.map(t => Math.abs(t.amount));
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const amountVariance = Math.max(...amounts) - Math.min(...amounts);
  const amountConsistent = amountVariance < avgAmount * 0.1; // <10% variance

  // Check interval consistency
  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = daysBetween(sorted[i-1].date, sorted[i].date);
    intervals.push(days);
  }

  const cycle = detectCycle(intervals);

  // Calculate confidence
  let confidence = 0.5;
  if (amountConsistent) confidence += 0.2;
  if (cycle !== 'unknown') confidence += 0.2;
  if (txns.length >= 3) confidence += 0.1;

  return {
    isRecurring: confidence >= 0.6,
    typicalAmount: avgAmount,
    cycle,
    confidence
  };
}

function detectCycle(intervals: number[]): BillingCycle {
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  if (avg >= 5 && avg <= 9) return 'weekly';
  if (avg >= 26 && avg <= 35) return 'monthly';
  if (avg >= 350 && avg <= 380) return 'yearly';
  return 'unknown';
}
```

**Edge Cases Handled:**
- Variable amounts (usage-based billing) → lower confidence, still shown
- Missed months → still detected if 2+ charges match
- Multiple charges same merchant → grouped together
- Refunds → filtered out (positive amounts)

---

## Review Screen UI

**Route:** `/dashboard/import/review`

```
┌─────────────────────────────────────────────────────────────┐
│  Bank Statement Import                              [Cancel] │
│  statement_jan2026.csv • 147 transactions found             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DETECTED RECURRING CHARGES (5)              [Select All]   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [✓] Netflix         $15.99/mo   3 charges found     │   │
│  │ [✓] Spotify         $10.99/mo   3 charges found     │   │
│  │ [✓] iCloud Storage   $2.99/mo   3 charges found     │   │
│  │ [ ] Planet Fitness  $24.99/mo   2 charges found     │   │
│  │ [ ] Adobe CC       $54.99/mo   2 charges found     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ALL TRANSACTIONS                    [Filter] [Search]      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [ ] Jan 15  AMAZON PRIME*1234     -$14.99           │   │
│  │ [ ] Jan 14  UBER TRIP             -$23.50           │   │
│  │ [ ] Jan 12  WHOLEFDS MKT          -$67.23           │   │
│  │ [ ] Jan 10  NETFLIX.COM            -$15.99  (recurring)│ │
│  │     ...                                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  3 subscriptions selected              [Import Selected]    │
└─────────────────────────────────────────────────────────────┘
```

**Confirmation Modal:**

```
┌────────────────────────────────────────┐
│  Confirm Import                        │
│                                        │
│  Adding 3 subscriptions:               │
│  • Netflix - $15.99/mo                 │
│  • Spotify - $10.99/mo                 │
│  • iCloud Storage - $2.99/mo           │
│                                        │
│  Total: $29.97/month                   │
│                                        │
│  [ Cancel ]  [ Confirm Import ]        │
└────────────────────────────────────────┘
```

---

## Error Handling

### Error Types

```typescript
const ERRORS = {
  INVALID_FILE_TYPE: {
    code: 'INVALID_FILE_TYPE',
    message: 'Please upload a CSV file. Other formats (PDF, OFX) are not yet supported.',
    recoverable: true
  },
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'File must be under 5MB. Try exporting a shorter date range.',
    recoverable: true
  },
  PARSE_FAILED: {
    code: 'PARSE_FAILED',
    message: 'We couldn\'t read this file. Please check it\'s a valid bank statement CSV.',
    recoverable: true
  },
  NO_TRANSACTIONS: {
    code: 'NO_TRANSACTIONS',
    message: 'No transactions found in this file. Please check the file contains transaction data.',
    recoverable: true
  },
  AI_PARSE_FAILED: {
    code: 'AI_PARSE_FAILED',
    message: 'We had trouble understanding this format. Please try a different export option from your bank.',
    recoverable: true
  },
};
```

### Error UI

```
┌────────────────────────────────────────┐
│  ⚠️  Import Failed                     │
│                                        │
│  We couldn't read this file. Please    │
│  check it's a valid bank statement     │
│  CSV.                                  │
│                                        │
│  Tips:                                 │
│  • Export as CSV, not PDF              │
│  • Use "Download transactions" option  │
│  • Try a shorter date range            │
│                                        │
│  [ Try Different File ]                │
└────────────────────────────────────────┘
```

---

## File Structure

```
lib/
  bank-import/
    processor.ts        # Main processing pipeline
    csv-parser.ts       # AI-powered CSV parsing
    merchant-matcher.ts # Alias DB + AI matching
    recurring-detector.ts # Pattern detection
    errors.ts           # Error definitions
    types.ts            # TypeScript interfaces

app/
  api/
    bank-import/
      route.ts          # POST endpoint for upload

  (dashboard)/
    import/
      page.tsx          # Upload screen
      review/
        page.tsx        # Review & confirm screen

components/
  bank-import/
    upload-dropzone.tsx    # Drag & drop file upload
    transaction-list.tsx   # Scrollable transaction list
    recurring-group.tsx    # Recurring charge card
    import-summary.tsx     # Confirmation modal

prisma/
  migrations/
    xxx_add_bank_import/   # Schema changes
  seed-merchant-aliases.ts # Initial alias data
```

---

## Implementation Order

1. Schema migration & seed merchant aliases
2. CSV parsing with AI
3. Merchant matching (alias DB + AI fallback)
4. Recurring detection algorithm
5. API endpoint
6. Upload UI
7. Review screen UI
8. Confirmation & subscription creation

---

## Cost Estimate

- AI CSV parsing: ~$0.01-0.05 per import (depends on file size)
- AI merchant matching: ~$0.001 per unknown merchant
- Typical import: $0.02-0.10 total

---

## Future Enhancements

- Plaid integration for direct bank connection
- PDF statement parsing
- OFX/QFX file support
- Re-import detection (avoid duplicates)
- Learn from user confirmations to improve alias database

---

**Document Version:** 1.0
**Last Updated:** 2026-01-13
**Status:** Ready for Implementation
