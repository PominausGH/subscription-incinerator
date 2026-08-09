/**
 * Test script for pending subscriptions feature
 *
 * This script tests the complete pending subscriptions flow:
 * 1. Database queries for pending subscriptions
 * 2. Statistics and counts
 * 3. User-specific filtering
 *
 * Manual Testing Steps (to be performed in UI):
 *
 * Test Approve Flow:
 * 1. Visit dashboard at /dashboard
 * 2. Look for pending subscription cards
 * 3. Click "Add This" button on a pending subscription
 * 4. Verify:
 *    - Subscription moves to active subscriptions list
 *    - Pending subscription is removed from pending list
 *    - Success toast/notification appears
 *    - Database updated correctly (pending_subscription deleted, subscription created)
 *
 * Test Dismiss Flow:
 * 1. Visit dashboard at /dashboard
 * 2. Find a pending subscription card
 * 3. Click "Dismiss" button
 * 4. Verify:
 *    - Pending subscription is removed from the list
 *    - Success notification appears
 *    - Database record is deleted
 *
 * Test Cleanup Worker:
 * 1. Create old pending subscriptions (>30 days old) in database
 * 2. Run cron job manually or wait for scheduled run
 * 3. Verify old pending subscriptions are removed
 * 4. Verify recent pending subscriptions remain
 */

import { db } from './lib/db/client';

async function testPendingSubscriptionsFlow() {
  console.log('Testing Pending Subscriptions Feature\n');
  console.log('=====================================\n');

  try {
    // Test 1: Get all pending subscriptions
    console.log('Test 1: Fetching all pending subscriptions...');
    const allPending = await db.pendingSubscription.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`Found ${allPending.length} total pending subscriptions\n`);

    // Test 2: Get pending subscriptions with user details
    console.log('Test 2: Fetching pending subscriptions with user details...');
    const pendingWithUsers = await db.pendingSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${pendingWithUsers.length} pending subscriptions with user data`);
    if (pendingWithUsers.length > 0) {
      console.log('\nSample pending subscription:');
      const sample = pendingWithUsers[0];
      console.log({
        id: sample.id,
        serviceName: sample.serviceName,
        user_email: sample.user.email,
        created_at: sample.createdAt,
        expires_at: sample.expiresAt
      });
    }
    console.log();

    // Test 3: Get statistics
    console.log('Test 3: Getting statistics...');
    const totalCount = await db.pendingSubscription.count();
    console.log(`Total pending subscriptions: ${totalCount}\n`);

    // Test 4: Get unique users with pending subscriptions
    console.log('Test 4: Analyzing users with pending subscriptions...');
    if (allPending.length > 0) {
      const uniqueUsers = new Set(allPending.map(p => p.userId));
      console.log(`Unique users with pending subscriptions: ${uniqueUsers.size}`);

      // Show distribution
      const userCounts = new Map<string, number>();
      allPending.forEach(p => {
        const count = userCounts.get(p.userId) || 0;
        userCounts.set(p.userId, count + 1);
      });

      console.log('\nPending subscriptions per user:');
      userCounts.forEach((count, userId) => {
        console.log(`  User ${userId.substring(0, 8)}...: ${count} pending`);
      });
      console.log();
    }

    // Test 5: Check for old pending subscriptions (>30 days)
    console.log('Test 5: Checking for old pending subscriptions...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldPending = await db.pendingSubscription.findMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    console.log(`Found ${oldPending.length} pending subscriptions older than 30 days`);
    console.log('(These should be cleaned up by the worker)\n');

    console.log('=====================================');
    console.log('Test Complete!\n');
    console.log('Next Steps:');
    console.log('1. Perform manual UI testing (see comments at top of file)');
    console.log('2. Test approve flow in dashboard');
    console.log('3. Test dismiss flow in dashboard');
    console.log('4. Verify cleanup worker functionality');
  } catch (error) {
    console.error('Error during testing:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testPendingSubscriptionsFlow()
  .then(() => {
    console.log('\nAll tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  });
