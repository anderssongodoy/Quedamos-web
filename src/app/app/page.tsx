import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSupabaseServer } from '@/lib/supabase/server'
import { planLabel } from '@/lib/plan-helpers'
import { CalendarDays, MapPin, Sparkles } from 'lucide-react'

export const metadata = { title: 'Mis planes' }
export const dynamic = 'force-dynamic'

function formatDate(date: string | null): string {
  if (!date) return 'sin fecha'
  return new Date(date).toLocaleString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AppHomePage() {
  const supabase = await getSupabaseServer()
  const { data: plans } = await supabase
    .from('plans')
    .select('id, title, type, status, location_name, starts_at, created_at, ai_confidence')
    .order('created_at', { ascending: false })
    .limit(50)

  // Para los planes que todavía no tienen título, el último job nos dice si
  // sigue procesándose o si falló (y por eso quedó "vacío").
  const pendingIds = (plans ?? []).filter((p) => p.status === 'draft' && !p.title).map((p) => p.id)
  const jobStatusByPlan = new Map<string, string>()
  if (pendingIds.length > 0) {
    const { data: jobs } = await supabase
      .from('processing_jobs')
      .select('plan_id, status, created_at')
      .in('plan_id', pendingIds)
      .order('created_at', { ascending: false })
    for (const j of jobs ?? []) {
      if (!jobStatusByPlan.has(j.plan_id)) jobStatusByPlan.set(j.plan_id, j.status)
    }
  }

  const grouped = {
    voting: (plans ?? []).filter((p) => p.status === 'voting' || p.status === 'draft'),
    confirmed: (plans ?? []).filter((p) => p.status === 'confirmed'),
    past: (plans ?? []).filter((p) => p.status === 'archived' || p.status === 'cancelled'),
  }

  const isEmpty = (plans?.length ?? 0) === 0

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 space-y-12">
      <header className="space-y-2">
        <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight">
          Tus planes
        </h1>
        <p className="text-muted-foreground">
          Subí una captura, pegá un link o escribí lo que viste — yo armo la ficha.
        </p>
      </header>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <Section
            title="Por confirmar"
            plans={grouped.voting}
            formatDate={formatDate}
            jobStatusByPlan={jobStatusByPlan}
          />
          <Section
            title="Confirmados"
            plans={grouped.confirmed}
            formatDate={formatDate}
            jobStatusByPlan={jobStatusByPlan}
          />
          {grouped.past.length > 0 && (
            <Section
              title="Pasados"
              plans={grouped.past}
              formatDate={formatDate}
              jobStatusByPlan={jobStatusByPlan}
            />
          )}
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles className="size-6" />
        </span>
        <h2 className="font-[var(--font-display)] text-2xl font-semibold">Tu primer plan</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Mandanos una captura del lugar o evento que viste, o pegá el link. La IA
          arma la ficha en segundos y te queda lista para compartir.
        </p>
        <Link href="/app/new" className="pt-2">
          <Button size="lg" className="btn-brand h-11 px-6">
            Crear plan
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

interface PlanLite {
  id: string
  title: string | null
  type: string | null
  status: string
  location_name: string | null
  starts_at: string | null
  created_at: string
  ai_confidence: number | null
}

function Section({
  title,
  plans,
  formatDate,
  jobStatusByPlan,
}: {
  title: string
  plans: PlanLite[]
  formatDate: (s: string | null) => string
  jobStatusByPlan: Map<string, string>
}) {
  if (plans.length === 0) return null
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => {
          const t = planLabel(plan.type as never)
          const incomplete = plan.status === 'draft' && !plan.title
          const jobStatus = incomplete ? jobStatusByPlan.get(plan.id) : undefined
          const failed = jobStatus === 'failed'
          const inProgress = incomplete && !failed
          return (
            <Link key={plan.id} href={`/app/plans/${plan.id}`}>
              <Card className="hover:border-brand/40 transition-colors h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t.emoji}</span>
                      <span>{t.es}</span>
                    </div>
                    <Badge
                      variant={
                        plan.status === 'confirmed'
                          ? 'default'
                          : failed
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {plan.status === 'voting' && 'Votando'}
                      {plan.status === 'draft' &&
                        (failed ? 'Error' : inProgress ? 'Procesando…' : 'Borrador')}
                      {plan.status === 'confirmed' && 'Confirmado'}
                      {plan.status === 'cancelled' && 'Cancelado'}
                      {plan.status === 'archived' && 'Pasado'}
                    </Badge>
                  </div>
                  <h3 className="font-[var(--font-display)] text-lg font-semibold leading-snug">
                    {plan.title ?? (failed ? 'No se pudo procesar' : 'Procesando captura…')}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {plan.location_name && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5" /> {plan.location_name}
                      </p>
                    )}
                    {plan.starts_at && (
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" /> {formatDate(plan.starts_at)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
