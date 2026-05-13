import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log("[v0] Auth successful, redirecting to:", next)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  console.log("[v0] Auth failed, redirecting to error")
  return NextResponse.redirect(`${origin}/auth/error`)
}
