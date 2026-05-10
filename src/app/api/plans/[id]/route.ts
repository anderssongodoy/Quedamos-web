import { NextResponse, type NextRequest } from 'next/server'
import { updatePlanSchema } from '@/lib/schemas'
import { getSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/plans/[id]'>) {
  const { id } = await ctx.params
  const supabase = await getSupabaseServer()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body
  try {
    body = updatePlanSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('plans')
    .update(body)
    .eq('id', id)
    .eq('creator_id', userData.user.id)
    .select('*')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ plan: data })
}
