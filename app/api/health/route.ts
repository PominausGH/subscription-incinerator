import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { connection as redis } from '@/lib/queue/client'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: ServiceStatus
    redis: ServiceStatus
  }
}

interface ServiceStatus {
  status: 'up' | 'down'
  latencyMs?: number
  error?: string
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return {
      status: 'up',
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    await redis.ping()
    return {
      status: 'up',
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function GET() {
  const [database, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ])

  const allServicesUp = database.status === 'up' && redisStatus.status === 'up'
  const anyServiceDown = database.status === 'down' || redisStatus.status === 'down'

  const health: HealthStatus = {
    status: allServicesUp ? 'healthy' : anyServiceDown ? 'unhealthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    services: {
      database,
      redis: redisStatus,
    },
  }

  const httpStatus = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503

  return NextResponse.json(health, { status: httpStatus })
}
