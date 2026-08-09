import { connection as redis } from '@/lib/queue/client'
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.windowSeconds

  try {
    // Use Redis sorted set with timestamps as scores
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart)
    
    // Count current requests in window
    const count = await redis.zcard(key)
    
    if (count >= config.limit) {
      // Get the oldest entry to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES')
      const reset = oldest.length >= 2 
        ? parseInt(oldest[1]) + config.windowSeconds 
        : now + config.windowSeconds
      
      return {
        success: false,
        remaining: 0,
        reset,
      }
    }
    
    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`)
    
    // Set expiry on the key
    await redis.expire(key, config.windowSeconds)
    
    return {
      success: true,
      remaining: config.limit - count - 1,
      reset: now + config.windowSeconds,
    }
  } catch (error) {
    // If Redis fails, allow the request (fail open)
    console.error('Rate limit check failed:', error)
    return {
      success: true,
      remaining: config.limit,
      reset: now + config.windowSeconds,
    }
  }
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             'unknown'
  return ip
}

/**
 * Rate limit response with proper headers
 */
export function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { 
      status: 429,
      headers: {
        'Retry-After': String(reset - Math.floor(Date.now() / 1000)),
        'X-RateLimit-Reset': String(reset),
      }
    }
  )
}

// Preset configurations for different endpoints
export const RATE_LIMITS = {
  // Strict limit for auth endpoints
  auth: { limit: 5, windowSeconds: 60 },
  // Standard API limit
  api: { limit: 100, windowSeconds: 60 },
  // Limit for expensive operations
  expensive: { limit: 10, windowSeconds: 60 },
  // Webhook limit (more lenient for external services)
  webhook: { limit: 200, windowSeconds: 60 },
} as const
