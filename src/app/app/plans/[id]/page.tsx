import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PUBLIC_ENV } from '@/lib/env'
import { PlanWorkspace } from './plan-workspace'

export const dynamic = 'force-dynamic'

export default async function PlanDetailPage({ params }: PageProps<'/app/plans/[id]'>) {
  const { id } = await params
  const supabase = await getSupabaseServer()

  const [planRes, optionsRes, participantsRes, votesRes, jobRes, linkRes] = await Promise.all([
    supabase.from('plans').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('plan_options')
      .select('*')
      .eq('plan_id', id)
      .order('starts_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('plan_participants')
      .select('id, status, guest_name, user_id')
      .eq('plan_id', id),
    supabase.from('plan_votes').select('option_id, vote_value').eq('plan_id', id),
    supabase
      .from('processing_jobs')
      .select('id, status, error_message, model_used, cost_usd, finished_at')
      .eq('plan_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('public_links')
      .select('token')
      .eq('plan_id', id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ])

  if (!planRes.data) notFound()

  const publicUrl = linkRes.data
    ? `${PUBLIC_ENV.APP_URL}/p/${linkRes.data.token}`
    : null

  return (
    <PlanWorkspace
      planId={id}
      initialPlan={planRes.data}
      initialOptions={optionsRes.data ?? []}
      initialParticipants={participantsRes.data ?? []}
      initialVotes={votesRes.data ?? []}
      initialJob={jobRes.data}
      publicUrl={publicUrl}
    />
  )
}
