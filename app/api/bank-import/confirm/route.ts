import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
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
    const session = await auth()

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
