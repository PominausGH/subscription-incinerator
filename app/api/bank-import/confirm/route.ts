import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { scheduleBillingReminders } from '@/lib/reminders/scheduler'
import { z } from 'zod'

// Zod schema for transaction validation
const transactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  balance: z.number().optional(),
  normalizedDate: z.coerce.date(),
  merchantName: z.string(),
  serviceName: z.string().nullable(),
  confidence: z.number(),
  matchSource: z.enum(['alias_db', 'ai', 'none']),
})

// Zod schema for recurring group validation
const recurringGroupSchema = z.object({
  merchantName: z.string(),
  serviceName: z.string().nullable(),
  transactions: z.array(transactionSchema),
  amount: z.number(),
  billingCycle: z.enum(['weekly', 'monthly', 'yearly', 'unknown']),
  confidence: z.number(),
})

// Zod schema for the confirm request
const confirmRequestSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  selectedGroups: z.array(recurringGroupSchema),
  selectedTransactions: z.array(transactionSchema),
  totalTransactions: z.number().int().nonnegative(),
  recurringDetected: z.number().int().nonnegative(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Please sign in to continue' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = confirmRequestSchema.parse(body)
    const { fileName, selectedGroups, selectedTransactions, totalTransactions, recurringDetected } = validated

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
    const createdSubscriptions = await db.$transaction(async (tx) => {
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

    // Schedule billing reminders for created subscriptions (outside transaction)
    try {
      for (const subscription of createdSubscriptions) {
        if (subscription.nextBillingDate) {
          await scheduleBillingReminders(subscription)
        }
      }
    } catch (error) {
      console.error('Failed to schedule reminders:', error)
      // Continue - subscriptions created successfully even if scheduling failed
    }

    return NextResponse.json({
      success: true,
      subscriptionsCreated: createdSubscriptions.length,
      subscriptions: createdSubscriptions
    })
  } catch (error) {
    console.error('Bank import confirm error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

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
