import { db } from './lib/db/client'

async function checkSubs() {
  const subs = await db.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      serviceName: true,
      amount: true,
      currency: true,
      createdAt: true,
      detectedFrom: true,
      status: true,
      nextBillingDate: true
    }
  })

  console.log('\n📊 Recent subscriptions:')
  console.log('Total found:', subs.length)
  console.log('\n')
  subs.forEach((sub, i) => {
    console.log(`${i + 1}. ${sub.serviceName}`)
    console.log(`   Amount: ${sub.currency}${sub.amount}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Detected From: ${sub.detectedFrom || 'manual'}`)
    console.log(`   Next Billing: ${sub.nextBillingDate}`)
    console.log(`   Created: ${sub.createdAt}`)
    console.log()
  })

  await db.$disconnect()
  process.exit(0)
}

checkSubs()
