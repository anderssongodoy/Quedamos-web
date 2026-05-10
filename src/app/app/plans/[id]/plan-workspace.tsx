'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Loader2,
  Trash2,
  Plus,
  AlertTriangle,
  Share2,
} from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { planLabel, shortShareText } from '@/lib/plan-helpers'
import type { Plan, PlanOption, PlanParticipant, PlanVote, ProcessingJob } from '@/lib/db-types'

type Props = {
  planId: string
  initialPlan: Plan
  initialOptions: PlanOption[]
  initialParticipants: Pick<PlanParticipant, 'id' | 'status' | 'guest_name' | 'user_id'>[]
  initialVotes: Pick<PlanVote, 'option_id' | 'vote_value'>[]
  initialJob: Pick<ProcessingJob, 'id' | 'status' | 'error_message' | 'model_used' | 'cost_usd' | 'finished_at'> | null
  publicUrl: string | null
}

// El PlanWorkspace usa los `initial*` directamente (no useState para sync).
// Cualquier cambio de DB → realtime → router.refresh() → padre RSC vuelve a fetchar
// y nos pasa props nuevos. Esto evita el anti-pattern de setState dentro de useEffect.
export function PlanWorkspace(props: Props) {
  const router = useRouter()
  const plan = props.initialPlan
  const options = props.initialOptions
  const participants = props.initialParticipants
  const votes = props.initialVotes
  const job = props.initialJob

  // Un job `failed` no es "procesando" aunque el plan siga en draft sin título —
  // si no, mostraríamos el spinner para siempre en vez del estado de error.
  const isProcessing =
    job?.status === 'pending' ||
    job?.status === 'processing' ||
    (job?.status !== 'failed' && plan.status === 'draft' && !plan.title)

  // Realtime: cualquier cambio relevante refresca la página (RSC fetchea de nuevo)
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`plan:${props.planId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans', filter: `id=eq.${props.planId}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'processing_jobs', filter: `plan_id=eq.${props.planId}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_options', filter: `plan_id=eq.${props.planId}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_votes', filter: `plan_id=eq.${props.planId}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_participants', filter: `plan_id=eq.${props.planId}` },
        () => router.refresh(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [props.planId, router])

  // Fallback de polling mientras se procesa: si Realtime no llega (publicación
  // no configurada, RLS, conexión caída), igual salimos de la pantalla de carga.
  useEffect(() => {
    if (!isProcessing) return
    const interval = setInterval(() => router.refresh(), 2500)
    return () => clearInterval(interval)
  }, [isProcessing, router])

  if (isProcessing) {
    return <ProcessingState job={job} planTitle={plan.title} />
  }

  if (job?.status === 'failed') {
    return <FailedState message={job.error_message ?? 'Error desconocido'} />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-8">
      <PlanHeader plan={plan} publicUrl={props.publicUrl} />
      {plan.warnings && plan.warnings.length > 0 && (
        <WarningsCard warnings={plan.warnings} missing={plan.missing_fields ?? []} />
      )}
      <PlanFields planId={props.planId} plan={plan} />
      <PlanOptionsEditor planId={props.planId} options={options} votes={votes} />
      <ParticipantsCard participants={participants} />
      <ConfirmCard
        planId={props.planId}
        plan={plan}
        options={options}
        votes={votes}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
function ProcessingState({
  job,
  planTitle,
}: {
  job: Props['initialJob']
  planTitle: string | null
}) {
  const steps = [
    'Leyendo la entrada',
    'Detectando lugar',
    'Buscando fecha y hora',
    'Armando opciones',
    'Preparando ficha',
  ]
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-5 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Loader2 className="size-6 animate-spin" />
      </span>
      <div className="space-y-2">
        <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
          Convirtiendo en plan…
        </h1>
        <p className="text-sm text-muted-foreground">
          {job?.status === 'processing'
            ? 'La IA está leyendo tu entrada. Esto suele tomar 5-15 segundos.'
            : 'En cola — arrancamos en un momento.'}
        </p>
      </div>
      <ul className="w-full space-y-2 text-left">
        {steps.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm"
          >
            <span className="grid size-6 place-items-center rounded-full bg-muted text-xs text-muted-foreground">
              {i + 1}
            </span>
            <span className="text-muted-foreground">{s}</span>
          </li>
        ))}
      </ul>
      {planTitle && (
        <p className="text-xs text-muted-foreground">Borrador detectado: {planTitle}</p>
      )}
    </div>
  )
}

function FailedState({ message }: { message: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-destructive/15 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold">
        No pudimos procesar la entrada
      </h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        Probá con otra captura o pegá el texto directamente.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
function PlanHeader({ plan, publicUrl }: { plan: Plan; publicUrl: string | null }) {
  const t = planLabel(plan.type)
  const confidence = plan.ai_confidence != null ? Math.round(plan.ai_confidence * 100) : null
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{t.emoji}</span> <span>{t.es}</span>
        {confidence != null && (
          <Badge variant="outline" className="border-brand/30 text-brand">
            {confidence}% confianza IA
          </Badge>
        )}
        <Badge variant={plan.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
          {plan.status}
        </Badge>
      </div>
      <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight">
        {plan.title ?? 'Sin título'}
      </h1>
      {publicUrl && <ShareBar plan={plan} url={publicUrl} />}
    </div>
  )
}

function ShareBar({ plan, url }: { plan: Plan; url: string }) {
  const text = `${shortShareText({ title: plan.title, location_name: plan.location_name, starts_at: plan.starts_at })}\n\n${url}`
  function copy() {
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copiado'),
      () => toast.error('No se pudo copiar'),
    )
  }
  function share() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator.share({ title: plan.title ?? 'Plan', text, url }).catch(() => {})
    } else {
      copy()
    }
  }
  return (
    <Card className="bg-brand-soft/40 border-brand/20">
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Link público</p>
          <p className="truncate text-sm font-mono text-foreground/80">{url}</p>
        </div>
        <Button size="sm" variant="outline" onClick={copy}>
          <Copy className="size-3.5" /> Copiar
        </Button>
        <Button size="sm" className="btn-brand" onClick={share}>
          <Share2 className="size-3.5" /> Compartir
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function WarningsCard({ warnings, missing }: { warnings: string[]; missing: string[] }) {
  return (
    <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="flex gap-3 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
        <div className="space-y-2 text-sm">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          {missing.length > 0 && (
            <p className="text-amber-800/80">
              Datos faltantes: {missing.join(', ')} — completalos abajo.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Convierte un ISO UTC ("2026-05-10T01:00:00Z") al formato que pide el input
// datetime-local pero EN HORA DE LIMA ("2026-05-09T20:00").
function isoToLimaInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  // Hora Lima = UTC - 5h (sin DST). Restamos el offset y formateamos.
  const limaMs = d.getTime() - 5 * 60 * 60 * 1000
  const lima = new Date(limaMs)
  const yyyy = lima.getUTCFullYear()
  const mm = String(lima.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(lima.getUTCDate()).padStart(2, '0')
  const hh = String(lima.getUTCHours()).padStart(2, '0')
  const mi = String(lima.getUTCMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function limaInputToIso(local: string): string | null {
  if (!local) return null
  // local es "YYYY-MM-DDTHH:mm" interpretado como Lima (-05:00)
  const d = new Date(`${local}:00-05:00`)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

function PlanFields({ planId, plan }: { planId: string; plan: Plan }) {
  // El form es controlado por el usuario; el plan viene de RSC y se actualiza
  // por router.refresh() tras realtime. Los inputs se reinician cuando cambia
  // plan.id (montaje) — durante la edición mantienen lo tipeado.
  const [title, setTitle] = useState(plan.title ?? '')
  const [description, setDescription] = useState(plan.description ?? '')
  const [location, setLocation] = useState(plan.location_name ?? '')
  const [address, setAddress] = useState(plan.address ?? '')
  const [startsAt, setStartsAt] = useState(isoToLimaInput(plan.starts_at))
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          description: description || null,
          location_name: location || null,
          address: address || null,
          starts_at: startsAt ? limaInputToIso(startsAt) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No pudimos guardar')
        return
      }
      toast.success('Guardado')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalles del plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Resumen</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Descripción corta para el grupo"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location">Lugar</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: La Trattoria"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Av. Sáenz Peña 295, Barranco"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="starts_at">Fecha y hora (Lima, UTC-5)</Label>
          <Input
            id="starts_at"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Si la IA detectó mal el día u hora, corregilo acá. Cuando confirmes el plan
            con una opción ganadora, este campo se actualiza solo.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="btn-brand">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function PlanOptionsEditor({
  planId,
  options,
  votes,
}: {
  planId: string
  options: PlanOption[]
  votes: Pick<PlanVote, 'option_id' | 'vote_value'>[]
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<{ datetime: string }[]>([])
  const [saving, setSaving] = useState(false)

  const voteCount = useMemo(() => {
    const map = new Map<string, { yes: number; maybe: number; no: number }>()
    for (const v of votes) {
      const c = map.get(v.option_id) ?? { yes: 0, maybe: 0, no: 0 }
      const key = v.vote_value as 'yes' | 'maybe' | 'no'
      c[key]++
      map.set(v.option_id, c)
    }
    return map
  }, [votes])

  function localFormat(iso: string | null) {
    if (!iso) return 'Opción libre'
    const d = new Date(iso)
    return d.toLocaleString('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function persist(items: PlanOption[]) {
    setSaving(true)
    try {
      const res = await fetch(`/api/plans/${planId}/options`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          options: items.map((o) => ({
            option_type: o.option_type,
            starts_at: o.starts_at,
            location_name: o.location_name,
            address: o.address,
            label: o.label,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo guardar')
        return
      }
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function deleteOption(id: string) {
    const next = options.filter((o) => o.id !== id)
    persist(next)
  }

  function addDraft() {
    setDraft((d) => [...d, { datetime: '' }])
  }

  async function commitDraft() {
    const newOptions = draft
      .filter((d) => d.datetime)
      .map((d) => ({
        plan_id: planId,
        id: '',
        is_winner: false,
        created_at: '',
        option_type: 'date_time' as const,
        starts_at: new Date(d.datetime).toISOString(),
        location_name: null,
        address: null,
        label: null,
      }))
    if (newOptions.length === 0) {
      toast.error('Agregá al menos una fecha')
      return
    }
    await persist([...options, ...newOptions])
    setDraft([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Opciones para votar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.length === 0 && draft.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sin opciones todavía. Agregá fechas para que el grupo vote.
          </p>
        )}
        {options.map((o) => {
          const c = voteCount.get(o.id) ?? { yes: 0, maybe: 0, no: 0 }
          return (
            <div
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{localFormat(o.starts_at)}</p>
                  {(o.location_name || o.address) && (
                    <p className="text-xs text-muted-foreground">
                      {o.location_name ?? o.address}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 text-xs">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    ✓ {c.yes}
                  </Badge>
                  <Badge variant="outline">~ {c.maybe}</Badge>
                  <Badge variant="outline">✗ {c.no}</Badge>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => deleteOption(o.id)}
                  disabled={saving}
                  title="Eliminar"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
        {draft.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type="datetime-local"
              value={d.datetime}
              onChange={(e) =>
                setDraft((arr) => arr.map((x, idx) => (idx === i ? { datetime: e.target.value } : x)))
              }
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDraft((arr) => arr.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={addDraft}>
            <Plus className="size-3.5" /> Otra fecha/hora
          </Button>
          {draft.length > 0 && (
            <Button size="sm" onClick={commitDraft} disabled={saving} className="btn-brand">
              Guardar opciones nuevas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function ParticipantsCard({
  participants,
}: {
  participants: Pick<PlanParticipant, 'id' | 'status' | 'guest_name' | 'user_id'>[]
}) {
  if (participants.length === 0) {
    return null
  }
  const counts = {
    going: participants.filter((p) => p.status === 'going').length,
    maybe: participants.filter((p) => p.status === 'maybe').length,
    not_going: participants.filter((p) => p.status === 'not_going').length,
    invited: participants.filter((p) => p.status === 'invited').length,
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quiénes están</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            ✓ Voy: {counts.going}
          </Badge>
          <Badge variant="outline">~ Maybe: {counts.maybe}</Badge>
          <Badge variant="outline">✗ No voy: {counts.not_going}</Badge>
          <Badge variant="outline" className="text-muted-foreground">
            … invitados: {counts.invited}
          </Badge>
        </div>
        <ul className="space-y-1 text-sm">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/40">
              <span>{p.guest_name ?? (p.user_id ? 'Vos / cuenta' : 'invitado')}</span>
              <span className="text-xs text-muted-foreground">{p.status}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function ConfirmCard({
  planId,
  plan,
  options,
  votes,
}: {
  planId: string
  plan: Plan
  options: PlanOption[]
  votes: Pick<PlanVote, 'option_id' | 'vote_value'>[]
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [selected, setSelected] = useState<string | null>(
    options.find((o) => o.is_winner)?.id ?? options[0]?.id ?? null,
  )

  if (plan.status === 'confirmed') {
    return (
      <Card className="border-success/30 bg-success/10">
        <CardContent className="flex items-start gap-3 p-5">
          <CheckCircle2 className="mt-0.5 size-5 text-success" />
          <div className="space-y-1">
            <p className="font-medium">Plan confirmado</p>
            <p className="text-sm text-muted-foreground">
              {plan.starts_at &&
                new Date(plan.starts_at).toLocaleString('es', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              {plan.location_name && ` · ${plan.location_name}`}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  async function confirm() {
    if (!selected) {
      toast.error('Elegí una opción ganadora')
      return
    }
    setConfirming(true)
    try {
      const res = await fetch(`/api/plans/${planId}/confirm`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ winning_option_id: selected }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo confirmar')
        return
      }
      toast.success('Plan confirmado')
      router.refresh()
    } finally {
      setConfirming(false)
    }
  }

  if (options.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cerrar el plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Elegí la opción ganadora. El plan pasa a confirmado y los votos se cierran.
        </p>
        <div className="space-y-2">
          {options.map((o) => {
            const tally = votes.filter((v) => v.option_id === o.id && v.vote_value === 'yes').length
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  selected === o.id ? 'border-brand bg-brand-soft/30' : 'border-border bg-card'
                }`}
              >
                <input
                  type="radio"
                  name="winner"
                  className="accent-[var(--brand)]"
                  checked={selected === o.id}
                  onChange={() => setSelected(o.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {o.starts_at
                      ? new Date(o.starts_at).toLocaleString('es', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : o.label ?? 'Opción'}
                  </p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                  ✓ {tally}
                </Badge>
              </label>
            )
          })}
        </div>
        <div className="flex justify-end">
          <Button onClick={confirm} disabled={!selected || confirming} className="btn-brand">
            {confirming ? 'Confirmando…' : 'Confirmar plan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
