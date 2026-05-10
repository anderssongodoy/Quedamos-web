import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { planOptionInputSchema } from '@/lib/schemas'
import { getSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const replaceBodySchema = z.object({
  options: z.array(planOptionInputSchema).max(10),
})

export async function POST(request: NextRequest, ctx: RouteContext<'/api/plans/[id]/options'>) {
  const { id: planId } = await ctx.params
  const supabase = await getSupabaseServer()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body
  try {
    body = replaceBodySchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse' },
      { status: 400 },
    )
  }

  // Verificar que el plan es del usuario antes de borrar/insertar
  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .select('id')
    .eq('id', planId)
    .eq('creator_id', userData.user.id)
    .maybeSingle()
  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })
  if (!plan) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { error: delErr } = await supabase.from('plan_options').delete().eq('plan_id', planId)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  if (body.options.length > 0) {
    const rows = body.options.map((o) => ({
      plan_id: planId,
      option_type: o.option_type,
      starts_at: o.starts_at ?? null,
      location_name: o.location_name ?? null,
      address: o.address ?? null,
      label: o.label ?? null,
    }))
    const { error: insErr } = await supabase.from('plan_options').insert(rows)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  // Si el plan estaba en draft y agregamos opciones → pasar a 'voting'
  await supabase
    .from('plans')
    .update({ status: 'voting' })
    .eq('id', planId)
    .eq('status', 'draft')

  const { data: options } = await supabase
    .from('plan_options')
    .select('*')
    .eq('plan_id', planId)
    .order('starts_at', { ascending: true, nullsFirst: false })

  return NextResponse.json({ options: options ?? [] })
}
