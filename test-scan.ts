import { db } from './lib/db/client'
import { addScanJob } from './lib/queue/scan-queue'

async function testScan() {
  try {
    console.log('Fetching user with Gmail connected...')
    const user = await db.user.findFirst({
      where: {
        emailProvider: 'gmail',
      },
      select: {
        id: true,
        email: true,
        emailProvider: true,
        oauthTokens: true
      }
    })

    if (!user) {
      console.log('❌ No user found with Gmail connected')
      console.log('Please connect Gmail first at http://localhost:3000/settings')
      process.exit(1)
    }

    console.log('✓ Found user:', user.email)
    console.log('✓ Email provider:', user.emailProvider)
    console.log('✓ Has OAuth tokens:', !!user.oauthTokens)

    console.log('\n🔍 Triggering email scan...')
    const job = await addScanJob({ userId: user.id, fullScan: true })
    console.log('✓ Scan job created:', job.id)
    console.log('✓ Job name:', job.name)
    console.log('\n📋 Check worker logs for scan progress...')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
    process.exit(0)
  }
}

testScan()
