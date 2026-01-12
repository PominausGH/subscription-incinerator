async function testEndpoints() {
  // Test approve endpoint
  const approveRes = await fetch('http://localhost:3000/api/pending-subscriptions/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pendingId: 'test-id' })
  })
  console.log('Approve:', approveRes.status)

  // Test dismiss endpoint
  const dismissRes = await fetch('http://localhost:3000/api/pending-subscriptions/dismiss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pendingId: 'test-id' })
  })
  console.log('Dismiss:', dismissRes.status)
}

testEndpoints()
