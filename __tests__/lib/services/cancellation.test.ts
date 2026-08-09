import { getCancellationSteps, getCancellationUrl } from '@/lib/services/cancellation'

describe('getCancellationSteps', () => {
  it('returns steps from ServiceConfig when available', () => {
    const config = {
      cancellationUrl: 'https://netflix.com/cancel',
      cancellationInstructions: {
        steps: ['Go to Account', 'Click Cancel Membership', 'Confirm cancellation'],
      },
    }
    const steps = getCancellationSteps(config)
    expect(steps).toHaveLength(3)
    expect(steps[0]).toBe('Go to Account')
  })

  it('returns generic steps when no ServiceConfig', () => {
    const steps = getCancellationSteps(null)
    expect(steps.length).toBeGreaterThan(0)
    expect(steps[0]).toContain('website')
  })
})

describe('getCancellationUrl', () => {
  it('prefers ServiceConfig cancellationUrl over subscription url', () => {
    const config = { cancellationUrl: 'https://netflix.com/cancel', cancellationInstructions: null }
    const url = getCancellationUrl(config, 'https://other.com/cancel')
    expect(url).toBe('https://netflix.com/cancel')
  })

  it('falls back to subscription cancellationUrl', () => {
    const url = getCancellationUrl(null, 'https://fallback.com/cancel')
    expect(url).toBe('https://fallback.com/cancel')
  })

  it('returns null when neither is set', () => {
    const url = getCancellationUrl(null, null)
    expect(url).toBeNull()
  })
})
