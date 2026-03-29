import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { serviceName } = await req.json()
  if (!serviceName) {
    return NextResponse.json({ error: 'serviceName required' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Give a concise 1-2 sentence description of the subscription service "${serviceName}". Include what it does and who it's for. No marketing fluff. If it's an AI tool explain what it specialises in. Reply with just the description, no preamble.`,
        },
      ],
    })

    const description = (message.content[0] as { type: string; text: string }).text.trim()
    return NextResponse.json({ description })
  } catch (error) {
    console.error('AI describe error:', error)
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
  }
}
