import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { serviceName, monthlyPrice } = await req.json()
  if (!serviceName || typeof serviceName !== 'string') {
    return NextResponse.json({ error: 'serviceName required' }, { status: 400 })
  }
  if (serviceName.trim().length === 0 || serviceName.length > 100) {
    return NextResponse.json({ error: 'serviceName must be 1-100 characters' }, { status: 400 })
  }

  const cleanName = serviceName.trim().slice(0, 100).replace(/["\n\r]/g, ' ')

  const price = Number(monthlyPrice)
  const yearlySaving = monthlyPrice != null && isFinite(price) && price >= 0
    ? Math.round(price * 12)
    : null

  // Step 1: DB lookup (case-insensitive)
  const dbResults = await db.openSourceAlternative.findMany({
    where: {
      serviceName: {
        mode: 'insensitive',
        contains: cleanName,
      },
    },
    orderBy: { stars: 'desc' },
  })

  if (dbResults.length > 0) {
    return NextResponse.json({ alternatives: dbResults, source: 'db', yearlySaving })
  }

  // Step 2: AI fallback
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Suggest up to 3 open source alternatives to "${cleanName}". For each, reply with a JSON array (no markdown, just raw JSON) with objects containing these exact keys: alternativeName, description (1 sentence), websiteUrl, sourceCodeUrl (GitHub URL), stars (estimated GitHub stars as integer), license (e.g. MIT, GPL-2.0), category (e.g. Productivity, Design, Communication). Only include actively maintained projects.`,
        },
      ],
    })

    const block = message.content[0]
    if (!block || block.type !== 'text') throw new Error('Unexpected AI response format')
    const raw = block.text.trim()
    const text = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(text)
    const alternatives = (Array.isArray(parsed) ? parsed : []).map((a: Record<string, unknown>, i: number) => ({
      id: `ai-${i}`,
      serviceName,
      alternativeName: String(a.alternativeName || ''),
      description: String(a.description || ''),
      websiteUrl: a.websiteUrl ? String(a.websiteUrl) : null,
      sourceCodeUrl: a.sourceCodeUrl ? String(a.sourceCodeUrl) : null,
      stars: Number(a.stars) || 0,
      license: a.license ? String(a.license) : null,
      category: a.category ? String(a.category) : null,
    }))

    return NextResponse.json({ alternatives, source: 'ai', yearlySaving })
  } catch (error) {
    console.error('AI alternatives error:', error)
    return NextResponse.json({ alternatives: [], source: 'ai', yearlySaving })
  }
}
