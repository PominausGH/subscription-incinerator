/**
 * @jest-environment node
 */

import { POST, GET } from '@/app/api/savings-goals/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))

const mockGoal = {
  id: 'goal-1',
  userId: 'user-1',
  name: 'Holiday Fund',
  targetAmount: '500.00',
  currency: 'USD',
  deadline: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

jest.mock('@/lib/db/client', () => ({
  db: {
    savingsGoal: {
      create: jest.fn().mockResolvedValue({
        id: 'goal-1',
        userId: 'user-1',
        name: 'Holiday Fund',
        targetAmount: '500.00',
        currency: 'USD',
        deadline: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findMany: jest.fn().mockResolvedValue([{
        id: 'goal-1',
        userId: 'user-1',
        name: 'Holiday Fund',
        targetAmount: '500.00',
        currency: 'USD',
        deadline: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]),
    },
  },
}))

describe('GET /api/savings-goals', () => {
  it('returns list of goals', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].name).toBe('Holiday Fund')
  })
})

describe('POST /api/savings-goals', () => {
  it('creates a savings goal', async () => {
    const req = new NextRequest('http://localhost/api/savings-goals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Holiday Fund', targetAmount: 500, currency: 'USD' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('Holiday Fund')
  })

  it('rejects missing name', async () => {
    const req = new NextRequest('http://localhost/api/savings-goals', {
      method: 'POST',
      body: JSON.stringify({ targetAmount: 500 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
