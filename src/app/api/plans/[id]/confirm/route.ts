import { NextResponse, type NextRequest } from 'next/server'
import { confirmPlanSchema } from '@/lib/schemas'
import { getSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/plans/[id]/confirm'>) {
  const { id: planId } = await ctx.params
  const supabase = await getSupabaseServer()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body
  try {
    body = confirmPlanSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse' },
      { status: 400 },
    )
  }

  // Verificar opción ganadora pertenece al plan + creador del plan
  const { data: option, error: optErr } = await supabase
    .from('plan_options')
    .select('id, plan_id, starts_at, location_name, address')
    .eq('id', body.winning_option_id)
    .eq('plan_id', planId)
    .maybeSingle()
  if (optErr) return NextResponse.json({ error: optErr.message }, { status: 500 })
  if (!option) return NextResponse.json({ error: 'option_not_found' }, { status: 404 })

  // Marcar ganadora (solo si el creador autoriza vía RLS)
  const { error: clearErr } = await supabase
    .from('plan_options')
    .update({ is_winner: false })
    .eq('plan_id', planId)
  if (clearErr) return NextResponse.json({ error: clearErr.message }, { status: 500 })

  await supabase
    .from('plan_options')
    .update({ is_winner: true })
    .eq('id', option.id)

  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .update({
      status: 'confirmed',
      starts_at: option.starts_at ?? undefined,
      location_name: option.location_name ?? undefined,
      address: option.address ?? undefined,
    })
    .eq('id', planId)
    .eq('creator_id', userData.user.id)
    .select('*')
    .maybeSingle()
  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })
  if (!plan) return NextResponse.json({ error: 'not_found_or_forbidden' }, { status: 404 })

  return NextResponse.json({ plan })
}
