# Bank Statement Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to upload bank statement CSVs to discover subscriptions via AI parsing and recurring pattern detection.

**Architecture:** CSV upload → AI parsing (Claude Haiku) → merchant matching (alias DB + AI fallback) → recurring detection → user review screen → subscription creation. Synchronous processing, dedicated review UI.

**Tech Stack:** Next.js API routes, Anthropic SDK (Claude Haiku), Prisma, React components with Tailwind CSS.

---

## Task 1: Database Schema

**Files:**
- Create: `prisma/migrations/YYYYMMDD_add_bank_import/migration.sql` (auto-generated)
- Modify: `prisma/schema.prisma`

**Step 1: Add BankImport model to schema**

Add to `prisma/schema.prisma` after PushSubscription model:

```prisma
model BankImport {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  fileName  String   @map("file_name")

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
  bankPattern String @unique @map("bank_pattern")
  serviceName String @map("service_name")

  @@map("merchant_aliases")
}
```

**Step 2: Add bankImports relation to User model**

In User model relations section, add:

```prisma
bankImports          BankImport[]
```

**Step 3: Add bankTransactionData to Subscription model**

After `rawEmailData` field in Subscription model:

```prisma
bankTransactionData Json? @map("bank_transaction_data")
```

**Step 4: Run migration**

Run: `npx prisma migrate dev --name add_bank_import`
Expected: Migration created and applied successfully

**Step 5: Commit**

```bash
git add prisma/
git commit -m "feat(db): add BankImport and MerchantAlias models"
```

---

## Task 2: Seed Merchant Aliases

**Files:**
- Create: `prisma/seed-merchant-aliases.ts`
- Modify: `package.json` (add seed script)

**Step 1: Create seed file**

Create `prisma/seed-merchant-aliases.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MERCHANT_ALIASES = [
  { bankPattern: 'NETFLIX*', serviceName: 'Netflix' },
  { bankPattern: 'SPOTIFY*', serviceName: 'Spotify' },
  { bankPattern: 'AMAZON PRIME*', serviceName: 'Amazon Prime' },
  { bankPattern: 'AMZN PRIME*', serviceName: 'Amazon Prime' },
  { bankPattern: 'PRIME VIDEO*', serviceName: 'Amazon Prime Video' },
  { bankPattern: 'APPLE.COM/BILL*', serviceName: 'Apple Services' },
  { bankPattern: 'HULU*', serviceName: 'Hulu' },
  { bankPattern: 'HBO MAX*', serviceName: 'HBO Max' },
  { bankPattern: 'MAX.COM*', serviceName: 'Max' },
  { bankPattern: 'DISNEY PLUS*', serviceName: 'Disney+' },
  { bankPattern: 'DISNEYPLUS*', serviceName: 'Disney+' },
  { bankPattern: 'DROPBOX*', serviceName: 'Dropbox' },
  { bankPattern: 'GITHUB*', serviceName: 'GitHub' },
  { bankPattern: 'GOOGLE *STORAGE*', serviceName: 'Google One' },
  { bankPattern: 'GOOGLE*YOUTUBE*', serviceName: 'YouTube Premium' },
  { bankPattern: 'YOUTUBE PREMIUM*', serviceName: 'YouTube Premium' },
  { bankPattern: 'MICROSOFT*XBOX*', serviceName: 'Xbox Game Pass' },
  { bankPattern: 'XBOX*', serviceName: 'Xbox Game Pass' },
  { bankPattern: 'PLAYSTATION*', serviceName: 'PlayStation Plus' },
  { bankPattern: 'SONY PLAYSTATION*', serviceName: 'PlayStation Plus' },
  { bankPattern: 'ADOBE*', serviceName: 'Adobe Creative Cloud' },
  { bankPattern: 'CHATGPT*', serviceName: 'ChatGPT Plus' },
  { bankPattern: 'OPENAI*', serviceName: 'OpenAI' },
  { bankPattern: 'NOTION*', serviceName: 'Notion' },
  { bankPattern: 'SLACK*', serviceName: 'Slack' },
  { bankPattern: 'ZOOM.US*', serviceName: 'Zoom' },
  { bankPattern: 'LINKEDIN*PREMIUM*', serviceName: 'LinkedIn Premium' },
  { bankPattern: 'AUDIBLE*', serviceName: 'Audible' },
  { bankPattern: 'KINDLE*', serviceName: 'Kindle Unlimited' },
  { bankPattern: 'PARAMOUNT+*', serviceName: 'Paramount+' },
  { bankPattern: 'PARAMOUNTPLUS*', serviceName: 'Paramount+' },
  { bankPattern: 'PEACOCK*', serviceName: 'Peacock' },
  { bankPattern: 'CRUNCHYROLL*', serviceName: 'Crunchyroll' },
  { bankPattern: 'NORDVPN*', serviceName: 'NordVPN' },
  { bankPattern: 'EXPRESSVPN*', serviceName: 'ExpressVPN' },
  { bankPattern: 'SURFSHARK*', serviceName: 'Surfshark' },
  { bankPattern: '1PASSWORD*', serviceName: '1Password' },
  { bankPattern: 'LASTPASS*', serviceName: 'LastPass' },
  { bankPattern: 'BITWARDEN*', serviceName: 'Bitwarden' },
  { bankPattern: 'GRAMMARLY*', serviceName: 'Grammarly' },
  { bankPattern: 'CANVA*', serviceName: 'Canva' },
  { bankPattern: 'FIGMA*', serviceName: 'Figma' },
  { bankPattern: 'MAILCHIMP*', serviceName: 'Mailchimp' },
  { bankPattern: 'EVERNOTE*', serviceName: 'Evernote' },
  { bankPattern: 'TODOIST*', serviceName: 'Todoist' },
  { bankPattern: 'HEADSPACE*', serviceName: 'Headspace' },
  { bankPattern: 'CALM.COM*', serviceName: 'Calm' },
  { bankPattern: 'DUOLINGO*', serviceName: 'Duolingo' },
  { bankPattern: 'MASTERCLASS*', serviceName: 'MasterClass' },
  { bankPattern: 'SKILLSHARE*', serviceName: 'Skillshare' },
]

async function main() {
  console.log('Seeding merchant aliases...')

  for (const alias of MERCHANT_ALIASES) {
    await prisma.merchantAlias.upsert({
      where: { bankPattern: alias.bankPattern },
      update: { serviceName: alias.serviceName },
      create: alias,
    })
  }

  console.log(`Seeded ${MERCHANT_ALIASES.length} merchant aliases`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Step 2: Add seed script to package.json**

Add to scripts in `package.json`:

```json
"seed:merchants": "npx ts-node prisma/seed-merchant-aliases.ts"
```

**Step 3: Run seed**

Run: `npm run seed:merchants`
Expected: "Seeded 50 merchant aliases"

**Step 4: Commit**

```bash
git add prisma/seed-merchant-aliases.ts package.json
git commit -m "feat(db): add merchant alias seed data"
```

---

## Task 3: Type Definitions

**Files:**
- Create: `lib/bank-import/types.ts`

**Step 1: Create types file**

Create `lib/bank-import/types.ts`:

```typescript
export interface RawTransaction {
  date: string
  description: string
  amount: number
  balance?: number
}

export interface Transaction extends RawTransaction {
  id: string
  normalizedDate: Date
  merchantName: string
  serviceName: string | null
  confidence: number
  matchSource: 'alias_db' | 'ai' | 'none'
}

export interface RecurringGroup {
  merchantName: string
  serviceName: string | null
  transactions: Transaction[]
  amount: number
  billingCycle: 'weekly' | 'monthly' | 'yearly' | 'unknown'
  confidence: number
}

export interface MerchantMatch {
  serviceName: string | null
  confidence: number
  source: 'alias_db' | 'ai' | 'none'
}

export interface ProcessingResult {
  transactions: Transaction[]
  recurringGroups: RecurringGroup[]
  stats: {
    totalTransactions: number
    recurringDetected: number
  }
}

export interface BankImportError {
  code: string
  message: string
  recoverable: boolean
}
```

**Step 2: Commit**

```bash
git add lib/bank-import/types.ts
git commit -m "feat(bank-import): add TypeScript type definitions"
```

---

## Task 4: Error Definitions

**Files:**
- Create: `lib/bank-import/errors.ts`

**Step 1: Create errors file**

Create `lib/bank-import/errors.ts`:

```typescript
export class BankImportError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public recoverable: boolean
  ) {
    super(message)
    this.name = 'BankImportError'
  }
}

export const ERRORS = {
  INVALID_FILE_TYPE: new BankImportError(
    'Invalid file type',
    'INVALID_FILE_TYPE',
    'Please upload a CSV file. Other formats (PDF, OFX) are not yet supported.',
    true
  ),
  FILE_TOO_LARGE: new BankImportError(
    'File exceeds size limit',
    'FILE_TOO_LARGE',
    'File must be under 5MB. Try exporting a shorter date range.',
    true
  ),
  EMPTY_FILE: new BankImportError(
    'Empty file',
    'EMPTY_FILE',
    'The uploaded file is empty. Please select a valid bank statement.',
    true
  ),
  NO_TRANSACTIONS: new BankImportError(
    'No transactions found',
    'NO_TRANSACTIONS',
    'No transactions found in this file. Please check the file contains transaction data.',
    true
  ),
  AI_PARSE_FAILED: new BankImportError(
    'AI parsing failed',
    'AI_PARSE_FAILED',
    "We had trouble understanding this format. Please try a different export option from your bank.",
    true
  ),
  INTERNAL_ERROR: new BankImportError(
    'Internal error',
    'INTERNAL_ERROR',
    'Something went wrong. Please try again.',
    true
  ),
}
```

**Step 2: Commit**

```bash
git add lib/bank-import/errors.ts
git commit -m "feat(bank-import): add error definitions"
```

---

## Task 5: CSV Parser with AI

**Files:**
- Create: `lib/bank-import/csv-parser.ts`
- Create: `__tests__/lib/bank-import/csv-parser.test.ts`

**Step 1: Write failing test**

Create `__tests__/lib/bank-import/csv-parser.test.ts`:

```typescript
import { parseCSVWithAI } from '@/lib/bank-import/csv-parser'

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify([
            { date: '2026-01-15', description: 'NETFLIX.COM', amount: -15.99 },
            { date: '2026-01-14', description: 'GROCERY STORE', amount: -45.23 },
          ])
        }]
      })
    }
  }))
}))

describe('parseCSVWithAI', () => {
  it('parses CSV content and returns transactions', async () => {
    const csvContent = `Date,Description,Amount
2026-01-15,NETFLIX.COM,-15.99
2026-01-14,GROCERY STORE,-45.23`

    const result = await parseCSVWithAI(csvContent)

    expect(result).toHaveLength(2)
    expect(result[0].description).toBe('NETFLIX.COM')
    expect(result[0].amount).toBe(-15.99)
  })

  it('throws error for empty content', async () => {
    await expect(parseCSVWithAI('')).rejects.toThrow('EMPTY_FILE')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/bank-import/csv-parser.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Create CSV parser implementation**

Create `lib/bank-import/csv-parser.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { RawTransaction } from './types'
import { ERRORS } from './errors'

const anthropic = new Anthropic()

export async function parseCSVWithAI(content: string): Promise<RawTransaction[]> {
  if (!content || content.trim().length === 0) {
    throw ERRORS.EMPTY_FILE
  }

  // Limit content size to avoid token limits
  const truncatedContent = content.slice(0, 50000)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Parse this bank statement CSV. Extract transactions as a JSON array.

Each transaction should have these fields:
- date: string (YYYY-MM-DD format)
- description: string (the merchant/payee name)
- amount: number (negative for debits/charges, positive for credits)
- balance: number (optional, if present)

CSV content:
${truncatedContent}

Return ONLY a valid JSON array, no other text. If you cannot parse the file, return an empty array [].`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    const transactions: RawTransaction[] = JSON.parse(jsonMatch[0])
    return transactions
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw ERRORS.AI_PARSE_FAILED
    }
    throw error
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/lib/bank-import/csv-parser.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/bank-import/csv-parser.ts __tests__/lib/bank-import/csv-parser.test.ts
git commit -m "feat(bank-import): add AI-powered CSV parser"
```

---

## Task 6: Merchant Matcher

**Files:**
- Create: `lib/bank-import/merchant-matcher.ts`
- Create: `__tests__/lib/bank-import/merchant-matcher.test.ts`

**Step 1: Write failing test**

Create `__tests__/lib/bank-import/merchant-matcher.test.ts`:

```typescript
import { findMerchantAlias, matchMerchant } from '@/lib/bank-import/merchant-matcher'
import { prismaMock } from '@/lib/test-utils'

// Mock Anthropic for AI fallback
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({ serviceName: 'Unknown Service', confidence: 0.6 })
        }]
      })
    }
  }))
}))

describe('findMerchantAlias', () => {
  it('finds exact match', async () => {
    prismaMock.merchantAlias.findFirst.mockResolvedValue({
      id: '1',
      bankPattern: 'NETFLIX*',
      serviceName: 'Netflix'
    })

    const result = await findMerchantAlias('NETFLIX.COM 800-123-4567')
    expect(result?.serviceName).toBe('Netflix')
  })

  it('returns null when no match', async () => {
    prismaMock.merchantAlias.findFirst.mockResolvedValue(null)
    prismaMock.merchantAlias.findMany.mockResolvedValue([])

    const result = await findMerchantAlias('RANDOM STORE')
    expect(result).toBeNull()
  })
})

describe('matchMerchant', () => {
  it('uses alias DB first, then AI fallback', async () => {
    prismaMock.merchantAlias.findFirst.mockResolvedValue(null)
    prismaMock.merchantAlias.findMany.mockResolvedValue([])

    const result = await matchMerchant('UNKNOWN MERCHANT')
    expect(result.source).toBe('ai')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/bank-import/merchant-matcher.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Update test-utils for Prisma mock**

Check if `lib/test-utils.ts` has prismaMock. If not, add:

```typescript
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

import prisma from '@/lib/db/client'

jest.mock('@/lib/db/client', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
```

**Step 4: Create merchant matcher implementation**

Create `lib/bank-import/merchant-matcher.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import prisma from '@/lib/db/client'
import { MerchantMatch } from './types'

const anthropic = new Anthropic()

export async function findMerchantAlias(description: string): Promise<{ serviceName: string } | null> {
  const normalized = description.toUpperCase().trim()

  // Try to find a matching alias using pattern matching
  const aliases = await prisma.merchantAlias.findMany()

  for (const alias of aliases) {
    const pattern = alias.bankPattern.replace(/\*/g, '.*')
    const regex = new RegExp(`^${pattern}`, 'i')
    if (regex.test(normalized)) {
      return { serviceName: alias.serviceName }
    }
  }

  return null
}

export async function matchMerchantWithAI(description: string): Promise<MerchantMatch> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Bank transaction description: "${description}"

What subscription service is this? Return JSON only:
{"serviceName": "Name or null", "confidence": 0.0-1.0}

Common examples:
- NETFLIX.COM 800-123 = Netflix
- SPOTIFY USA = Spotify
- AMZN PRIME*1234 = Amazon Prime
- APPLE.COM/BILL = Apple Services

If not a recognizable subscription service, return {"serviceName": null, "confidence": 0.0}`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { serviceName: null, confidence: 0, source: 'ai' }
    }

    const result = JSON.parse(jsonMatch[0])
    return {
      serviceName: result.serviceName,
      confidence: result.confidence || 0,
      source: 'ai'
    }
  } catch {
    return { serviceName: null, confidence: 0, source: 'ai' }
  }
}

export async function matchMerchant(description: string): Promise<MerchantMatch> {
  // Tier 1: Check alias database (fast, free)
  const alias = await findMerchantAlias(description)
  if (alias) {
    return {
      serviceName: alias.serviceName,
      confidence: 0.95,
      source: 'alias_db'
    }
  }

  // Tier 2: AI fallback
  return await matchMerchantWithAI(description)
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- __tests__/lib/bank-import/merchant-matcher.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add lib/bank-import/merchant-matcher.ts __tests__/lib/bank-import/merchant-matcher.test.ts
git commit -m "feat(bank-import): add merchant matching with alias DB and AI fallback"
```

---

## Task 7: Recurring Detection

**Files:**
- Create: `lib/bank-import/recurring-detector.ts`
- Create: `__tests__/lib/bank-import/recurring-detector.test.ts`

**Step 1: Write failing test**

Create `__tests__/lib/bank-import/recurring-detector.test.ts`:

```typescript
import { detectRecurringCharges, analyzePattern } from '@/lib/bank-import/recurring-detector'
import { Transaction } from '@/lib/bank-import/types'

const createTransaction = (
  date: string,
  description: string,
  amount: number,
  serviceName: string | null = null
): Transaction => ({
  id: Math.random().toString(),
  date,
  normalizedDate: new Date(date),
  description,
  amount,
  merchantName: description,
  serviceName,
  confidence: 0.9,
  matchSource: 'alias_db'
})

describe('detectRecurringCharges', () => {
  it('detects monthly recurring charges', () => {
    const transactions: Transaction[] = [
      createTransaction('2026-01-15', 'NETFLIX.COM', -15.99, 'Netflix'),
      createTransaction('2025-12-15', 'NETFLIX.COM', -15.99, 'Netflix'),
      createTransaction('2025-11-15', 'NETFLIX.COM', -15.99, 'Netflix'),
      createTransaction('2026-01-10', 'GROCERY STORE', -45.23),
    ]

    const result = detectRecurringCharges(transactions)

    expect(result).toHaveLength(1)
    expect(result[0].serviceName).toBe('Netflix')
    expect(result[0].billingCycle).toBe('monthly')
    expect(result[0].amount).toBeCloseTo(15.99)
  })

  it('requires 2+ transactions to detect recurring', () => {
    const transactions: Transaction[] = [
      createTransaction('2026-01-15', 'NETFLIX.COM', -15.99, 'Netflix'),
    ]

    const result = detectRecurringCharges(transactions)
    expect(result).toHaveLength(0)
  })

  it('detects yearly charges', () => {
    const transactions: Transaction[] = [
      createTransaction('2026-01-01', 'AMAZON PRIME', -139.00, 'Amazon Prime'),
      createTransaction('2025-01-01', 'AMAZON PRIME', -139.00, 'Amazon Prime'),
    ]

    const result = detectRecurringCharges(transactions)

    expect(result).toHaveLength(1)
    expect(result[0].billingCycle).toBe('yearly')
  })
})

describe('analyzePattern', () => {
  it('calculates confidence based on amount consistency', () => {
    const consistent = [
      createTransaction('2026-01-15', 'TEST', -10.00),
      createTransaction('2025-12-15', 'TEST', -10.00),
    ]
    const inconsistent = [
      createTransaction('2026-01-15', 'TEST', -10.00),
      createTransaction('2025-12-15', 'TEST', -50.00),
    ]

    const consistentResult = analyzePattern(consistent)
    const inconsistentResult = analyzePattern(inconsistent)

    expect(consistentResult.confidence).toBeGreaterThan(inconsistentResult.confidence)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/bank-import/recurring-detector.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Create recurring detector implementation**

Create `lib/bank-import/recurring-detector.ts`:

```typescript
import { Transaction, RecurringGroup } from './types'

type BillingCycle = 'weekly' | 'monthly' | 'yearly' | 'unknown'

interface PatternAnalysis {
  isRecurring: boolean
  typicalAmount: number
  cycle: BillingCycle
  confidence: number
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function detectCycle(intervals: number[]): BillingCycle {
  if (intervals.length === 0) return 'unknown'

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length

  if (avg >= 5 && avg <= 9) return 'weekly'
  if (avg >= 26 && avg <= 35) return 'monthly'
  if (avg >= 350 && avg <= 380) return 'yearly'
  return 'unknown'
}

export function analyzePattern(transactions: Transaction[]): PatternAnalysis {
  if (transactions.length < 2) {
    return { isRecurring: false, typicalAmount: 0, cycle: 'unknown', confidence: 0 }
  }

  // Sort by date
  const sorted = [...transactions].sort(
    (a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime()
  )

  // Check amount consistency
  const amounts = sorted.map(t => Math.abs(t.amount))
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const amountVariance = Math.max(...amounts) - Math.min(...amounts)
  const amountConsistent = amountVariance < avgAmount * 0.1 // <10% variance

  // Check interval consistency
  const intervals: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const days = daysBetween(sorted[i - 1].normalizedDate, sorted[i].normalizedDate)
    intervals.push(days)
  }

  const cycle = detectCycle(intervals)

  // Calculate confidence
  let confidence = 0.5
  if (amountConsistent) confidence += 0.2
  if (cycle !== 'unknown') confidence += 0.2
  if (transactions.length >= 3) confidence += 0.1

  return {
    isRecurring: confidence >= 0.6,
    typicalAmount: avgAmount,
    cycle,
    confidence
  }
}

function groupByMerchant(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {}

  for (const txn of transactions) {
    const key = txn.serviceName || txn.merchantName
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(txn)
  }

  return groups
}

export function detectRecurringCharges(transactions: Transaction[]): RecurringGroup[] {
  // Filter to debits only (negative amounts)
  const debits = transactions.filter(t => t.amount < 0)

  // Group transactions by merchant
  const groups = groupByMerchant(debits)

  const recurring: RecurringGroup[] = []

  for (const [merchant, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue // Need 2+ to detect pattern

    const analysis = analyzePattern(txns)

    if (analysis.isRecurring) {
      recurring.push({
        merchantName: txns[0].merchantName,
        serviceName: txns[0].serviceName,
        transactions: txns,
        amount: analysis.typicalAmount,
        billingCycle: analysis.cycle,
        confidence: analysis.confidence
      })
    }
  }

  return recurring.sort((a, b) => b.confidence - a.confidence)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/lib/bank-import/recurring-detector.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/bank-import/recurring-detector.ts __tests__/lib/bank-import/recurring-detector.test.ts
git commit -m "feat(bank-import): add recurring charge detection algorithm"
```

---

## Task 8: Main Processor

**Files:**
- Create: `lib/bank-import/processor.ts`
- Create: `__tests__/lib/bank-import/processor.test.ts`

**Step 1: Write failing test**

Create `__tests__/lib/bank-import/processor.test.ts`:

```typescript
import { processCSVContent, validateFile } from '@/lib/bank-import/processor'
import { ERRORS } from '@/lib/bank-import/errors'

describe('validateFile', () => {
  it('accepts valid CSV file', () => {
    const file = new File(['content'], 'statement.csv', { type: 'text/csv' })
    expect(() => validateFile(file)).not.toThrow()
  })

  it('rejects non-CSV files', () => {
    const file = new File(['content'], 'statement.pdf', { type: 'application/pdf' })
    expect(() => validateFile(file)).toThrow(ERRORS.INVALID_FILE_TYPE)
  })

  it('rejects files over 5MB', () => {
    const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' })
    expect(() => validateFile(file)).toThrow(ERRORS.FILE_TOO_LARGE)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/bank-import/processor.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Create processor implementation**

Create `lib/bank-import/processor.ts`:

```typescript
import { parseCSVWithAI } from './csv-parser'
import { matchMerchant } from './merchant-matcher'
import { detectRecurringCharges } from './recurring-detector'
import { Transaction, ProcessingResult, RawTransaction } from './types'
import { ERRORS, BankImportError } from './errors'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateFile(file: File): void {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw ERRORS.INVALID_FILE_TYPE
  }

  if (file.size > MAX_FILE_SIZE) {
    throw ERRORS.FILE_TOO_LARGE
  }
}

async function normalizeTransactions(raw: RawTransaction[]): Promise<Transaction[]> {
  const transactions: Transaction[] = []

  for (const txn of raw) {
    const match = await matchMerchant(txn.description)

    transactions.push({
      id: crypto.randomUUID(),
      date: txn.date,
      normalizedDate: new Date(txn.date),
      description: txn.description,
      amount: txn.amount,
      balance: txn.balance,
      merchantName: txn.description,
      serviceName: match.serviceName,
      confidence: match.confidence,
      matchSource: match.source
    })
  }

  return transactions
}

export async function processCSVContent(content: string): Promise<ProcessingResult> {
  // Parse CSV with AI
  const rawTransactions = await parseCSVWithAI(content)

  if (rawTransactions.length === 0) {
    throw ERRORS.NO_TRANSACTIONS
  }

  // Normalize merchants
  const transactions = await normalizeTransactions(rawTransactions)

  // Detect recurring patterns
  const recurringGroups = detectRecurringCharges(transactions)

  return {
    transactions,
    recurringGroups,
    stats: {
      totalTransactions: transactions.length,
      recurringDetected: recurringGroups.length
    }
  }
}

export async function processBankStatement(file: File): Promise<ProcessingResult> {
  // Validate file
  validateFile(file)

  // Read file content
  const content = await file.text()

  if (!content || content.trim().length === 0) {
    throw ERRORS.EMPTY_FILE
  }

  return processCSVContent(content)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/lib/bank-import/processor.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/bank-import/processor.ts __tests__/lib/bank-import/processor.test.ts
git commit -m "feat(bank-import): add main processor with validation"
```

---

## Task 9: API Endpoint

**Files:**
- Create: `app/api/bank-import/route.ts`

**Step 1: Create API route**

Create `app/api/bank-import/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processBankStatement } from '@/lib/bank-import/processor'
import { BankImportError } from '@/lib/bank-import/errors'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Please sign in to continue' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'Please select a file to upload' },
        { status: 400 }
      )
    }

    const result = await processBankStatement(file)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bank import error:', error)

    if (error instanceof BankImportError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.userMessage,
          recoverable: error.recoverable
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again.',
        recoverable: true
      },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add app/api/bank-import/route.ts
git commit -m "feat(api): add bank-import POST endpoint"
```

---

## Task 10: Confirm Import API

**Files:**
- Create: `app/api/bank-import/confirm/route.ts`

**Step 1: Create confirm endpoint**

Create `app/api/bank-import/confirm/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db/client'
import { Transaction, RecurringGroup } from '@/lib/bank-import/types'

interface ConfirmRequest {
  fileName: string
  selectedGroups: RecurringGroup[]
  selectedTransactions: Transaction[]
  totalTransactions: number
  recurringDetected: number
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Please sign in to continue' },
        { status: 401 }
      )
    }

    const body: ConfirmRequest = await req.json()
    const { fileName, selectedGroups, selectedTransactions, totalTransactions, recurringDetected } = body

    // Combine selections (groups + individual transactions)
    const subscriptionsToCreate: Array<{
      serviceName: string
      amount: number
      billingCycle: string
      bankTransactionData: object
    }> = []

    // Add from recurring groups
    for (const group of selectedGroups) {
      subscriptionsToCreate.push({
        serviceName: group.serviceName || group.merchantName,
        amount: group.amount,
        billingCycle: group.billingCycle === 'unknown' ? 'monthly' : group.billingCycle,
        bankTransactionData: {
          merchantName: group.merchantName,
          transactions: group.transactions,
          detectedAt: new Date().toISOString()
        }
      })
    }

    // Add from individual transactions
    for (const txn of selectedTransactions) {
      // Skip if already added from a group
      const alreadyAdded = subscriptionsToCreate.some(
        s => s.serviceName === (txn.serviceName || txn.merchantName)
      )
      if (alreadyAdded) continue

      subscriptionsToCreate.push({
        serviceName: txn.serviceName || txn.merchantName,
        amount: Math.abs(txn.amount),
        billingCycle: 'monthly', // Default for individual transactions
        bankTransactionData: {
          merchantName: txn.merchantName,
          transaction: txn,
          detectedAt: new Date().toISOString()
        }
      })
    }

    // Create subscriptions in database
    const createdSubscriptions = await prisma.$transaction(async (tx) => {
      const subscriptions = []

      for (const sub of subscriptionsToCreate) {
        const created = await tx.subscription.create({
          data: {
            userId: session.user.id,
            serviceName: sub.serviceName,
            status: 'active',
            amount: sub.amount,
            billingCycle: sub.billingCycle,
            detectedFrom: 'bank_import',
            bankTransactionData: sub.bankTransactionData
          }
        })
        subscriptions.push(created)
      }

      // Record the import
      await tx.bankImport.create({
        data: {
          userId: session.user.id,
          fileName,
          totalTransactions,
          recurringDetected,
          subscriptionsCreated: subscriptions.length
        }
      })

      return subscriptions
    })

    return NextResponse.json({
      success: true,
      subscriptionsCreated: createdSubscriptions.length,
      subscriptions: createdSubscriptions
    })
  } catch (error) {
    console.error('Bank import confirm error:', error)

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create subscriptions. Please try again.',
        recoverable: true
      },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add app/api/bank-import/confirm/route.ts
git commit -m "feat(api): add bank-import confirm endpoint"
```

---

## Task 11: Upload Page UI

**Files:**
- Create: `app/(dashboard)/import/page.tsx`
- Create: `components/bank-import/upload-dropzone.tsx`

**Step 1: Create upload dropzone component**

Create `components/bank-import/upload-dropzone.tsx`:

```typescript
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  isLoading: boolean
  error: string | null
}

export function UploadDropzone({ onFileSelect, isLoading, error }: UploadDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isLoading
  })

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div className="text-4xl">📄</div>

          {isLoading ? (
            <div>
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2" />
              <p className="text-gray-600">Processing your statement...</p>
            </div>
          ) : isDragActive ? (
            <p className="text-blue-600 font-medium">Drop your CSV file here</p>
          ) : (
            <>
              <p className="text-gray-600">
                Drag and drop your bank statement CSV here, or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supports CSV files up to 5MB
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <div className="mt-2 text-sm text-red-500">
            <p>Tips:</p>
            <ul className="list-disc list-inside">
              <li>Export as CSV, not PDF</li>
              <li>Use "Download transactions" option</li>
              <li>Try a shorter date range</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create upload page**

Create `app/(dashboard)/import/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadDropzone } from '@/components/bank-import/upload-dropzone'

export default function ImportPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/bank-import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to process file')
        return
      }

      // Store result in sessionStorage and redirect to review
      sessionStorage.setItem('bankImportResult', JSON.stringify({
        ...data,
        fileName: file.name
      }))
      router.push('/import/review')
    } catch (err) {
      setError('Failed to upload file. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Import Bank Statement</h1>
        <p className="text-gray-600 mb-8">
          Upload your bank statement CSV to automatically detect subscriptions.
          We'll analyze your transactions and find recurring charges.
        </p>

        <UploadDropzone
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">How to export your bank statement:</h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Log in to your bank's website or app</li>
            <li>Navigate to your account transactions</li>
            <li>Look for "Download" or "Export" option</li>
            <li>Select CSV format (not PDF)</li>
            <li>Choose date range (3+ months recommended)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Install react-dropzone if needed**

Run: `npm install react-dropzone`

**Step 4: Commit**

```bash
git add app/\\(dashboard\\)/import/page.tsx components/bank-import/upload-dropzone.tsx package.json package-lock.json
git commit -m "feat(ui): add bank import upload page with dropzone"
```

---

## Task 12: Review Page UI

**Files:**
- Create: `app/(dashboard)/import/review/page.tsx`
- Create: `components/bank-import/recurring-group.tsx`
- Create: `components/bank-import/transaction-list.tsx`

**Step 1: Create recurring group component**

Create `components/bank-import/recurring-group.tsx`:

```typescript
'use client'

import { RecurringGroup } from '@/lib/bank-import/types'

interface RecurringGroupCardProps {
  group: RecurringGroup
  selected: boolean
  onToggle: () => void
}

export function RecurringGroupCard({ group, selected, onToggle }: RecurringGroupCardProps) {
  const formatCycle = (cycle: string) => {
    switch (cycle) {
      case 'weekly': return '/wk'
      case 'monthly': return '/mo'
      case 'yearly': return '/yr'
      default: return ''
    }
  }

  return (
    <div
      onClick={onToggle}
      className={`
        p-4 border rounded-lg cursor-pointer transition-colors
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-5 h-5 rounded"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1">
          <div className="font-medium">
            {group.serviceName || group.merchantName}
          </div>
          <div className="text-sm text-gray-500">
            {group.transactions.length} charges found
          </div>
        </div>

        <div className="text-right">
          <div className="font-medium">
            ${group.amount.toFixed(2)}{formatCycle(group.billingCycle)}
          </div>
          <div className="text-xs text-gray-400">
            {Math.round(group.confidence * 100)}% confidence
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create transaction list component**

Create `components/bank-import/transaction-list.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Transaction } from '@/lib/bank-import/types'

interface TransactionListProps {
  transactions: Transaction[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  recurringIds: Set<string>
}

export function TransactionList({
  transactions,
  selectedIds,
  onToggle,
  recurringIds
}: TransactionListProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'debits' | 'credits'>('debits')

  const filtered = transactions.filter(txn => {
    const matchesSearch = txn.description.toLowerCase().includes(search.toLowerCase()) ||
      (txn.serviceName?.toLowerCase().includes(search.toLowerCase()))

    const matchesFilter = filter === 'all' ||
      (filter === 'debits' && txn.amount < 0) ||
      (filter === 'credits' && txn.amount > 0)

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="debits">Debits only</option>
          <option value="credits">Credits only</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
        {filtered.map((txn) => (
          <div
            key={txn.id}
            onClick={() => onToggle(txn.id)}
            className={`
              p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50
              ${selectedIds.has(txn.id) ? 'bg-blue-50' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(txn.id)}
              onChange={() => onToggle(txn.id)}
              className="w-4 h-4 rounded"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {txn.serviceName || txn.description}
                </span>
                {recurringIds.has(txn.id) && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    recurring
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {txn.date} • {txn.description}
              </div>
            </div>

            <div className={`font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {txn.amount < 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No transactions found
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Create review page**

Create `app/(dashboard)/import/review/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecurringGroupCard } from '@/components/bank-import/recurring-group'
import { TransactionList } from '@/components/bank-import/transaction-list'
import { ProcessingResult, RecurringGroup, Transaction } from '@/lib/bank-import/types'

interface ImportData extends ProcessingResult {
  fileName: string
}

export default function ReviewPage() {
  const router = useRouter()
  const [data, setData] = useState<ImportData | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('bankImportResult')
    if (!stored) {
      router.push('/import')
      return
    }

    const parsed: ImportData = JSON.parse(stored)
    setData(parsed)

    // Pre-select all recurring groups
    const groupIds = new Set(parsed.recurringGroups.map((_, i) => `group-${i}`))
    setSelectedGroups(groupIds)
  }, [router])

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  const toggleGroup = (index: number) => {
    const id = `group-${index}`
    const next = new Set(selectedGroups)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedGroups(next)
  }

  const toggleTransaction = (id: string) => {
    const next = new Set(selectedTransactions)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedTransactions(next)
  }

  const selectAllGroups = () => {
    const allIds = new Set(data.recurringGroups.map((_, i) => `group-${i}`))
    setSelectedGroups(allIds)
  }

  const clearGroups = () => {
    setSelectedGroups(new Set())
  }

  // Get IDs of transactions that are part of recurring groups
  const recurringTransactionIds = new Set(
    data.recurringGroups.flatMap(g => g.transactions.map(t => t.id))
  )

  // Count total selected subscriptions
  const selectedGroupCount = selectedGroups.size
  const selectedTxnCount = [...selectedTransactions].filter(
    id => !recurringTransactionIds.has(id)
  ).length
  const totalSelected = selectedGroupCount + selectedTxnCount

  const handleConfirm = async () => {
    setIsSubmitting(true)

    try {
      const selectedGroupData = data.recurringGroups.filter(
        (_, i) => selectedGroups.has(`group-${i}`)
      )

      const selectedTxnData = data.transactions.filter(
        t => selectedTransactions.has(t.id) && !recurringTransactionIds.has(t.id)
      )

      const response = await fetch('/api/bank-import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: data.fileName,
          selectedGroups: selectedGroupData,
          selectedTransactions: selectedTxnData,
          totalTransactions: data.stats.totalTransactions,
          recurringDetected: data.stats.recurringDetected
        })
      })

      if (!response.ok) {
        throw new Error('Failed to confirm import')
      }

      // Clear session storage and redirect
      sessionStorage.removeItem('bankImportResult')
      router.push('/dashboard?imported=true')
    } catch (error) {
      console.error('Confirm error:', error)
      alert('Failed to import subscriptions. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Review Import</h1>
          <p className="text-gray-600">
            {data.fileName} • {data.stats.totalTransactions} transactions found
          </p>
        </div>

        <button
          onClick={() => router.push('/import')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>

      {/* Recurring Groups */}
      {data.recurringGroups.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Detected Recurring Charges ({data.recurringGroups.length})
            </h2>
            <div className="space-x-2">
              <button
                onClick={selectAllGroups}
                className="text-sm text-blue-600 hover:underline"
              >
                Select All
              </button>
              <button
                onClick={clearGroups}
                className="text-sm text-gray-600 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {data.recurringGroups.map((group, index) => (
              <RecurringGroupCard
                key={index}
                group={group}
                selected={selectedGroups.has(`group-${index}`)}
                onToggle={() => toggleGroup(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Transactions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">All Transactions</h2>
        <TransactionList
          transactions={data.transactions}
          selectedIds={selectedTransactions}
          onToggle={toggleTransaction}
          recurringIds={recurringTransactionIds}
        />
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-gray-600">
            {totalSelected} subscription{totalSelected !== 1 ? 's' : ''} selected
          </div>

          <button
            onClick={handleConfirm}
            disabled={totalSelected === 0 || isSubmitting}
            className={`
              px-6 py-2 rounded-lg font-medium
              ${totalSelected > 0 && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'Importing...' : `Import ${totalSelected} Subscription${totalSelected !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Spacer for fixed footer */}
      <div className="h-20" />
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add app/\\(dashboard\\)/import/review/page.tsx components/bank-import/recurring-group.tsx components/bank-import/transaction-list.tsx
git commit -m "feat(ui): add bank import review page with recurring detection"
```

---

## Task 13: Add Import Button to Dashboard

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx` (add import button)

**Step 1: Find dashboard page and add import button**

Locate the dashboard page and add a button linking to `/import`. Look for an actions area or header section and add:

```tsx
<Link
  href="/import"
  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
>
  <span>📄</span>
  <span>Import Bank Statement</span>
</Link>
```

**Step 2: Commit**

```bash
git add app/\\(dashboard\\)/dashboard/page.tsx
git commit -m "feat(ui): add import bank statement button to dashboard"
```

---

## Task 14: Export Types and Create Index

**Files:**
- Create: `lib/bank-import/index.ts`

**Step 1: Create barrel export**

Create `lib/bank-import/index.ts`:

```typescript
export * from './types'
export * from './errors'
export { parseCSVWithAI } from './csv-parser'
export { matchMerchant, findMerchantAlias } from './merchant-matcher'
export { detectRecurringCharges, analyzePattern } from './recurring-detector'
export { processBankStatement, processCSVContent, validateFile } from './processor'
```

**Step 2: Commit**

```bash
git add lib/bank-import/index.ts
git commit -m "feat(bank-import): add barrel export"
```

---

## Task 15: Final Testing

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Manual test**

1. Start dev server: `npm run dev`
2. Navigate to `/import`
3. Upload a sample CSV
4. Verify review page shows recurring charges
5. Confirm import and verify subscriptions appear in dashboard

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(bank-import): complete bank statement import feature"
```

---

## Summary

**Files Created:**
- `lib/bank-import/types.ts`
- `lib/bank-import/errors.ts`
- `lib/bank-import/csv-parser.ts`
- `lib/bank-import/merchant-matcher.ts`
- `lib/bank-import/recurring-detector.ts`
- `lib/bank-import/processor.ts`
- `lib/bank-import/index.ts`
- `app/api/bank-import/route.ts`
- `app/api/bank-import/confirm/route.ts`
- `app/(dashboard)/import/page.tsx`
- `app/(dashboard)/import/review/page.tsx`
- `components/bank-import/upload-dropzone.tsx`
- `components/bank-import/recurring-group.tsx`
- `components/bank-import/transaction-list.tsx`
- `prisma/seed-merchant-aliases.ts`
- `__tests__/lib/bank-import/*.test.ts`

**Schema Changes:**
- Added `BankImport` model
- Added `MerchantAlias` model
- Added `bankTransactionData` field to `Subscription`

**Dependencies Added:**
- `react-dropzone`
