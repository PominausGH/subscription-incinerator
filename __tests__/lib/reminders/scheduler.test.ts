import { scheduleTrialReminders } from '@/lib/reminders/scheduler'
import { mockSubscription } from '@/lib/test-utils'

// Mock dependencies
jest.mock('@/lib/db/client', () => ({
  db: {
    reminder: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/queue/client', () => ({
  queues: {
    reminders: {
      add: jest.fn(),
    },
  },
}))

describe('scheduleTrialReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('schedules 3 reminders for a trial subscription', async () => {
    const { db } = require('@/lib/db/client')
    const { queues } = require('@/lib/queue/client')

    // Mock findFirst to return null (no existing reminders)
    db.reminder.findFirst.mockResolvedValue(null)

    // Mock create to return a reminder object
    db.reminder.create.mockResolvedValue({
      id: '1',
      subscriptionId: mockSubscription.id,
      reminderType: 'trial_ending',
      status: 'pending',
    })

    // Mock queue add to return a job with an ID
    queues.reminders.add.mockResolvedValue({ id: 'job-1' })

    // Mock update to succeed
    db.reminder.update.mockResolvedValue({})

    // Create a subscription with trialEndsAt in the future
    const trialSubscription = {
      ...mockSubscription,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }

    await scheduleTrialReminders(trialSubscription)

    // Should create 3 reminders (24h, 3h, 1h before trial end)
    expect(db.reminder.create).toHaveBeenCalledTimes(3)
    expect(queues.reminders.add).toHaveBeenCalledTimes(3)
  })

  it('skips scheduling if no trial end date', async () => {
    const { db } = require('@/lib/db/client')
    const { queues } = require('@/lib/queue/client')

    const nonTrialSubscription = {
      ...mockSubscription,
      trialEndsAt: null,
    }

    await scheduleTrialReminders(nonTrialSubscription)

    expect(db.reminder.create).not.toHaveBeenCalled()
    expect(queues.reminders.add).not.toHaveBeenCalled()
  })
})
