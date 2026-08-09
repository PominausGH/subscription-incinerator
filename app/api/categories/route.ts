import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { PRESET_CATEGORIES } from '@/lib/categories/presets'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if preset categories exist, if not create them
    const existingPresets = await db.category.findMany({
      where: { isPreset: true },
    })

    if (existingPresets.length === 0) {
      // Seed preset categories
      await db.category.createMany({
        data: PRESET_CATEGORIES.map(cat => ({
          name: cat.name,
          isPreset: true,
          userId: null,
        })),
        skipDuplicates: true,
      })
    }

    // Get all categories (presets + user's custom ones)
    const categories = await db.category.findMany({
      where: {
        OR: [
          { isPreset: true },
          { userId: session.user.id },
        ],
      },
      orderBy: [
        { isPreset: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: 'Category name must be 50 characters or less' }, { status: 400 })
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        userId: session.user.id,
        isPreset: false,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
