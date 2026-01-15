import { User, Subscription } from '@prisma/client'
import { Prisma } from '@prisma/client'

export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  emailVerified: null,
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  oauthTokens: null,
  emailProvider: null,
  tier: 'free',
  notificationPreferences: { email: true, push: true, sms: false },
  phoneNumber: null,
  phoneVerified: false,
  stripeCustomerId: null,
}

export const mockSubscription: Subscription = {
  id: '1',
  userId: '1',
  serviceName: 'Netflix',
  status: 'active',
  billingCycle: 'monthly',
  amount: new Prisma.Decimal(15.99),
  currency: 'USD',
  trialEndsAt: null,
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancellationUrl: null,
  autoCancelEnabled: false,
  detectedFrom: 'manual',
  type: 'PERSONAL',
  categoryId: null,
  rawEmailData: null,
  bankTransactionData: null,
  reminderSettings: null,
  externalId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export function mockPrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reminder: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }
}
