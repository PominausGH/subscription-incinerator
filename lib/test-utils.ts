import { User, Subscription } from '@prisma/client'

export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockSubscription: Subscription = {
  id: '1',
  userId: '1',
  name: 'Netflix',
  amount: 15.99,
  currency: 'USD',
  billingCycle: 'MONTHLY',
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  category: 'Entertainment',
  status: 'ACTIVE',
  isTrialing: true,
  trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
