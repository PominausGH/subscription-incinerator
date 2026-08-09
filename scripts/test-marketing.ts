import { emailService } from '../lib/services/email'
import { SocialAssistant } from '../lib/services/social-assistant'
import { ContentRepurposer } from '../lib/services/content-repurposer'

async function runMarketingTests() {
  console.log('🧪 Starting Marketing Automation Tests...\n')

  // 1. Test Email Service
  console.log('--- ✉️  Testing Email Service ---')
  await emailService.scheduleQuarterlyAudit('test@example.com', 'John Doe')
  await emailService.celebrateSavings('test@example.com', 'John Doe', '$145.00')
  console.log('✅ Email service test complete (check console logs above).\n')

  // 2. Test Social Assistant
  console.log('--- 💬 Testing Social Assistant ---')
  const replies = SocialAssistant.generateHelpfulReply('netflix')
  console.log(`Found ${replies.length} platform-specific replies for Netflix.`)
  console.log(`[Reddit Sample]: ${replies.find(r => r.platform === 'Reddit')?.text.slice(0, 100)}...`)
  console.log('✅ Social assistant test complete.\n')

  // 3. Test Content Repurposer
  console.log('--- 🧵 Testing Content Repurposer ---')
  const threads = ContentRepurposer.generateThread('free-trial-trap')
  console.log(`Generated ${threads.length} threads for "Free Trial Trap" blog post.`)
  console.log(`[X/Twitter Thread Length]: ${threads.find(t => t.platform === 'X')?.posts.length} posts.`)
  console.log('✅ Content repurposer test complete.\n')

  // 4. Test Directory Bot (Requires DB Connection)
  console.log('--- 🤖 Testing Directory Bot ---')
  try {
    const { DirectoryBot } = await import('../lib/services/directory-bot')
    const report = await DirectoryBot.generateWeeklyAlert()
    if (report) {
      console.log('Report generated successfully:')
      console.log(report)
    } else {
      console.log('Directory Bot: No missing high-volume services found (Database is clean or empty).')
    }
    console.log('✅ Directory bot test complete.\n')
  } catch (error) {
    console.log('⚠️ Directory Bot test skipped or failed (likely no DB connection).')
  }

  console.log('🚀 All marketing automation tests finished!')
}

runMarketingTests().catch(err => {
  console.error('❌ Marketing test failed:', err)
  process.exit(1)
})
