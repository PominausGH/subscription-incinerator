import { db } from './lib/db/client'

async function check() {
  const all = await db.pendingSubscription.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, serviceName: true, status: true, confidence: true, createdAt: true }
  })

  console.log(`Total pending subscriptions: ${all.length}\n`)

  const byStatus = all.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('By status:')
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })

  console.log('\nRecent items:')
  all.slice(0, 6).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.serviceName} - ${p.status} (${Number(p.confidence) * 100}%)`)
  })

  await db.$disconnect()
}

check()
