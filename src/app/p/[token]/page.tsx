import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSupabaseAnon } from '@/lib/supabase/anon'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PUBLIC_ENV } from '@/lib/env'
import { GuestPlanView } from './guest-plan-view'

export const dynamic = 'force-dynamic'

interface PublicPayload {
  plan: {
    id: string
    title: string | null
    description: string | null
    type: string | null
    status: string
    location_name: string | null
    address: string | null
    starts_at: string | null
    cover_image_url: string | null
    requirements: string[] | null
    warnings: string[] | null
  }
  creator: { name: string | null; avatar_url: string | null }
  options: Array<{
    id: string
    starts_at: string | null
    location_name: string | null
    address: string | null
    label: string | null
    is_winner: boolean
  }>
  participants: Array<{ id: string; name: string; is_guest: boolean; status: string }>
  votes_summary: Record<string, { yes: number; maybe: number; no: number }>
  comments: Array<{ id: string; body: string; author_name: string; created_at: string }>
}

export async function generateMetadata({ params }: PageProps<'/p/[token]'>) {
  const { token } = await params
  const supabase = getSupabaseAnon()
  const { data } = await supabase.rpc('get_public_plan', { p_token: token })
  if (!data) return { title: 'Plan no encontrado' }
  const payload = data as unknown as PublicPayload
  return {
    title: payload.plan.title ?? 'Plan',
    description: payload.plan.description ?? 'Decidí este plan con tu grupo en Quedamos',
    openGraph: {
      title: payload.plan.title ?? 'Plan',
      description: payload.plan.description ?? undefined,
      images: payload.plan.cover_image_url ? [payload.plan.cover_image_url] : undefined,
    },
    robots: { index: false, follow: false },
  }
}

export default async function PublicPlanPage({ params }: PageProps<'/p/[token]'>) {
  const { token } = await params
  const supabase = getSupabaseAnon()
  const { data, error } = await supabase.rpc('get_public_plan', { p_token: token })
  if (error || !data) notFound()
  const payload = data as unknown as PublicPayload

  // Si quien abre el link es un usuario logueado y dueño del plan,
  // mandalo al editor — no tiene sentido mostrarle "sumate como invitado".
  const ssr = await getSupabaseServer()
  const { data: userData } = await ssr.auth.getUser()
  if (userData.user) {
    const { data: ownPlan } = await ssr
      .from('plans')
      .select('id')
      .eq('id', payload.plan.id)
      .eq('creator_id', userData.user.id)
      .maybeSingle()
    if (ownPlan) {
      redirect(`/app/plans/${payload.plan.id}`)
    }
  }

  const cookieStore = await cookies()
  const guestCookie = cookieStore.get(`quedamos_guest_${token}`)
  const guestParticipant = guestCookie
    ? payload.participants.find(
        (p) => p.is_guest && cookieStore.get(`quedamos_guest_name_${token}`)?.value === p.name,
      ) ?? null
    : null

  return (
    <GuestPlanView
      token={token}
      payload={payload}
      hasGuestSession={!!guestCookie}
      cachedGuestName={cookieStore.get(`quedamos_guest_name_${token}`)?.value ?? null}
      cachedParticipant={guestParticipant}
      appUrl={PUBLIC_ENV.APP_URL}
    />
  )
}
