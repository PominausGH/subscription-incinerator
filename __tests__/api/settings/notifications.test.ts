/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock next-auth to avoid ESM import issues
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}))

jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}))

jest.mock('next-auth/providers/resend', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { GET, PUT } from '@/app/api/settings/notifications/route'
import { db } from '@/lib/db/client'
import { auth } from '@/lib/auth'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockDb = db as jest.Mocked<typeof db>

describe('GET /api/settings/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
  })

  it('returns notification preferences for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.user.findUnique.mockResolvedValue({
      notificationPreferences: {
        channels: { email: true, push: false },
        defaults: { trial: ['24h'], billing: ['7d', '1d'] },
      },
    } as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.channels.email).toBe(true)
    expect(data.defaults.trial).toContain('24h')
  })

  it('returns default preferences when user has no preferences set', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.user.findUnique.mockResolvedValue({
      notificationPreferences: null,
    } as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.channels.email).toBe(true)
    expect(data.channels.push).toBe(false)
    expect(data.defaults.trial).toEqual(['24h', '1h'])
    expect(data.defaults.billing).toEqual(['7d', '1d'])
  })
})

describe('PUT /api/settings/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        channels: { email: true, push: true },
        defaults: { trial: ['24h'], billing: ['7d'] },
      }),
    })

    const response = await PUT(request)

    expect(response.status).toBe(401)
  })

  it('updates notification preferences', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.user.update.mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        channels: { email: true, push: true },
        defaults: { trial: ['24h', '12h'], billing: ['14d', '7d'] },
      }),
    })

    const response = await PUT(request)

    expect(response.status).toBe(200)
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        notificationPreferences: {
          channels: { email: true, push: true },
          defaults: { trial: ['24h', '12h'], billing: ['14d', '7d'] },
        },
      },
    })
  })

  it('uses default values for missing fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.user.update.mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        channels: { email: false },
        defaults: {},
      }),
    })

    const response = await PUT(request)

    expect(response.status).toBe(200)
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        notificationPreferences: {
          channels: { email: false, push: false },
          defaults: { trial: ['24h', '1h'], billing: ['7d', '1d'] },
        },
      },
    })
  })
})
