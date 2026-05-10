import { NextResponse, type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { guestJoinSchema } from '@/lib/schemas'
import { getSupabaseAnon } from '@/lib/supabase/anon'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/p/[token]/join'>) {
  const { token } = await ctx.params

  let body
  try {
    body = guestJoinSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse' },
      { status: 400 },
    )
  }

  const cookieName = `quedamos_guest_${token}`
  const existing = request.cookies.get(cookieName)?.value
  const guestToken = existing && existing.length >= 16 ? existing : nanoid(24)

  const supabase = getSupabaseAnon()
  const { data, error } = await supabase.rpc('guest_join_plan', {
    p_token: token,
    p_guest_token: guestToken,
    p_guest_name: body.name,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const res = NextResponse.json({ participant_id: data, name: body.name })
  res.cookies.set({
    name: cookieName,
    value: guestToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 días
  })
  return res
}
