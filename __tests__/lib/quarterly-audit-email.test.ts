/**
 * @jest-environment node
 */
import { emailTemplates } from '@/lib/email/templates'

describe('quarterlyAuditReminder template', () => {
  it('includes the unsubscribe link', () => {
    const t = emailTemplates.quarterlyAuditReminder('Sam', 'https://example.test/api/unsubscribe?token=abc')
    expect(t.body).toContain('Unsubscribe: https://example.test/api/unsubscribe?token=abc')
  })
})
