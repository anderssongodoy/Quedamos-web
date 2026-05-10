import { NextResponse, type NextRequest } from 'next/server'
import { guestRsvpSchema } from '@/lib/schemas'
import { getSupabaseAnon } from '@/lib/supabase/anon'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/p/[token]/rsvp'>) {
  const { token } = await ctx.params
  const guestToken = request.cookies.get(`quedamos_guest_${token}`)?.value
  if (!guestToken) return NextResponse.json({ error: 'guest_not_joined' }, { status: 401 })

  let body
  try {
    body = guestRsvpSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse' },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAnon()
  const { error } = await supabase.rpc('guest_set_rsvp', {
    p_token: token,
    p_guest_token: guestToken,
    p_status: body.status,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
