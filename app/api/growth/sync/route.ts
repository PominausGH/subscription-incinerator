import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

export async function POST(req: Request) {
  try {
    const { password, fixId, code } = await req.json()

    // 1. Security Check
    if (password !== process.env.ADMIN_MARKETING_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Save the fix
    const storagePath = path.join(process.cwd(), 'src/lib/marketing/overrides.json')
    const dir = path.dirname(storagePath)
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    let overrides: Record<string, string> = {}
    if (fs.existsSync(storagePath)) {
      overrides = JSON.parse(fs.readFileSync(storagePath, 'utf8'))
    }

    overrides[fixId] = code
    fs.writeFileSync(storagePath, JSON.stringify(overrides, null, 2))

    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('❌ Growth Sync Error:', error)
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 })
  }
}
