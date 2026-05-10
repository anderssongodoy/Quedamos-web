import { NextResponse, type NextRequest } from 'next/server'
import { guestVoteSchema } from '@/lib/schemas'
import { getSupabaseAnon } from '@/lib/supabase/anon'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/p/[token]/vote'>) {
  const { token } = await ctx.params
  const guestToken = request.cookies.get(`quedamos_guest_${token}`)?.value
  if (!guestToken) return NextResponse.json({ error: 'guest_not_joined' }, { status: 401 })

  let body
  try {
    body = guestVoteSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse' },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAnon()
  const { error } = await supabase.rpc('guest_cast_vote', {
    p_token: token,
    p_guest_token: guestToken,
    p_option_id: body.option_id,
    p_vote: body.vote,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
