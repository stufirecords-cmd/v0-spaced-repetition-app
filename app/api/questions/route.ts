import { getCurrentUser, addQuestion } from '@/lib/supabase-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const question = await addQuestion(user.id, body)

    return NextResponse.json(question)
  } catch (error) {
    console.error('[v0] Error adding question:', error)
    return NextResponse.json(
      { error: 'Failed to add question' },
      { status: 500 }
    )
  }
}
