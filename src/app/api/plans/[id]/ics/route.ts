import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnon } from '@/lib/supabase/anon'
import { buildIcs } from '@/lib/ics'
import { PUBLIC_ENV } from '@/lib/env'

export const runtime = 'nodejs'

// Acceso vía ?token=xxxx (link público) — sin auth requerida.
export async function GET(request: NextRequest, ctx: RouteContext<'/api/plans/[id]/ics'>) {
  const { id } = await ctx.params
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token_required' }, { status: 400 })

  const supabase = getSupabaseAnon()
  const { data: result, error } = await supabase.rpc('get_public_plan', { p_token: token })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!result) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // result es jsonb; lo casteamos
  const payload = result as unknown as {
    plan: { id: string; title: string | null; description: string | null; location_name: string | null; address: string | null; starts_at: string | null }
  }
  if (payload.plan.id !== id) {
    return NextResponse.json({ error: 'plan_mismatch' }, { status: 400 })
  }
  if (!payload.plan.starts_at) {
    return NextResponse.json({ error: 'plan_has_no_date' }, { status: 422 })
  }

  const ics = buildIcs({
    uid: payload.plan.id,
    title: payload.plan.title ?? 'Plan',
    description: payload.plan.description,
    location: payload.plan.address ?? payload.plan.location_name,
    startsAt: new Date(payload.plan.starts_at),
    url: `${PUBLIC_ENV.APP_URL}/p/${token}`,
  })

  return new NextResponse(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="quedamos-${id}.ics"`,
      'cache-control': 'no-store',
    },
  })
}
