import { detectSubscription, detectRecurringEmails } from '../lib/email/scanner'
import { GmailMessage } from '../lib/email/gmail-client'

// Mock messages
const messages: GmailMessage[] = [
  {
    id: 'msg1',
    threadId: 't1',
    from: 'Netflix <billing@netflix.com>',
    subject: 'Your Netflix Membership',
    body: 'Your monthly charge is $15.99/month. Thank you for being a member.',
    date: new Date(),
    snippet: 'Your monthly charge is $15.99/month'
  },
  {
    id: 'msg2',
    threadId: 't2',
    from: 'Spotify <no-reply@spotify.com>',
    subject: 'Your Spotify Premium Subscription',
    body: 'Monthly subscription: USD 10.99 per month. Charged to your card.',
    date: new Date(),
    snippet: 'Monthly subscription: USD 10.99 per month'
  },
  {
    id: 'msg3',
    threadId: 't3',
    from: 'Disney+ <billing@disneyplus.com>',
    subject: 'Your Disney+ Subscription',
    body: 'Amount: A$13.99 monthly. Next billing date: July 15, 2026.',
    date: new Date(),
    snippet: 'Amount: A$13.99 monthly'
  }
]

async function testScanner() {
  console.log('🧪 Testing Email Scanner with Home Currency Support...\n')

  // Test with AUD as home currency
  const homeCurrency = 'AUD'
  console.log(`🏠 Home Currency: ${homeCurrency}\n`)

  messages.forEach(msg => {
    console.log(`📧 Email from: ${msg.from}`)
    console.log(`   Subject: ${msg.subject}`)
    console.log(`   Snippet: ${msg.snippet}`)
    
    const detection = detectSubscription(msg, homeCurrency)
    if (detection) {
      console.log(`   ✅ DETECTED: ${detection.service}`)
      console.log(`      Amount: ${detection.amount}`)
      console.log(`      Currency: ${detection.currency} ${detection.currency === homeCurrency ? '(matched home currency)' : '(explicitly detected)'}`)
    } else {
      console.log('   ❌ NOT DETECTED')
    }
    console.log('')
  })

  // Test recurring detection (mocking multiple messages from same sender)
  console.log('🔄 Testing Frequency Analysis (AUD home currency)...\n')
  const recurringMessages: GmailMessage[] = [
    {
      id: 'rec1',
      threadId: 'tr1',
      from: 'Awesome SaaS <billing@awesomesaas.com>',
      subject: 'Monthly Receipt',
      body: 'You were charged $49.00',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      snippet: 'You were charged $49.00'
    },
    {
      id: 'rec2',
      threadId: 'tr1',
      from: 'Awesome SaaS <billing@awesomesaas.com>',
      subject: 'Monthly Receipt',
      body: 'You were charged $49.00',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      snippet: 'You were charged $49.00'
    }
  ]

  const frequencyDetections = detectRecurringEmails(recurringMessages, homeCurrency)
  frequencyDetections.forEach(d => {
    console.log(`   ✅ FREQUENCY DETECTED: ${d.service}`)
    console.log(`      Amount: ${d.amount}`)
    console.log(`      Currency: ${d.currency} (matched home currency)`)
    console.log(`      Interval: ${d.billingCycle}`)
  })
}

testScanner().catch(console.error)
