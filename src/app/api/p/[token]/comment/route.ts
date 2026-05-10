import { NextResponse, type NextRequest } from 'next/server'
import { guestCommentSchema } from '@/lib/schemas'
import { getSupabaseAnon } from '@/lib/supabase/anon'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/p/[token]/comment'>) {
  const { token } = await ctx.params
  const guestToken = request.cookies.get(`quedamos_guest_${token}`)?.value
  if (!guestToken) return NextResponse.json({ error: 'guest_not_joined' }, { status: 401 })

  let body
  try {
    body = guestCommentSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse' },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAnon()
  const { data, error } = await supabase.rpc('guest_add_comment', {
    p_token: token,
    p_guest_token: guestToken,
    p_body: body.body,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ comment_id: data })
}
