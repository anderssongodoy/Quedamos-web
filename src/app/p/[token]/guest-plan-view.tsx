'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Sparkles,
  Send,
  Share2,
} from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase/browser'

interface Props {
  token: string
  appUrl: string
  hasGuestSession: boolean
  cachedGuestName: string | null
  cachedParticipant: { id: string; name: string; status: string } | null
  payload: {
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
}

export function GuestPlanView(props: Props) {
  const router = useRouter()
  const [joinedName, setJoinedName] = useState<string | null>(props.cachedGuestName)
  const isConfirmed = props.payload.plan.status === 'confirmed'

  // Suscripción realtime: cualquier cambio en este plan refresca.
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel(`public-plan:${props.payload.plan.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_votes', filter: `plan_id=eq.${props.payload.plan.id}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_participants', filter: `plan_id=eq.${props.payload.plan.id}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_comments', filter: `plan_id=eq.${props.payload.plan.id}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans', filter: `id=eq.${props.payload.plan.id}` },
        () => router.refresh(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [props.payload.plan.id, router])

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md btn-brand text-xs">Q</span>
            Quedamos
          </Link>
          <span className="text-xs text-muted-foreground">{isConfirmed ? '✓ Confirmado' : 'Decidiendo'}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-5 py-8">
        <PlanHeader plan={props.payload.plan} creator={props.payload.creator} />

        {props.payload.plan.warnings && props.payload.plan.warnings.length > 0 && (
          <Card className="border-amber-300/40 bg-amber-50/40 dark:bg-amber-950/20">
            <CardContent className="p-4 text-sm">
              <p className="text-amber-800 dark:text-amber-300">
                ⚠️ {props.payload.plan.warnings.join(' · ')}
              </p>
            </CardContent>
          </Card>
        )}

        {!joinedName ? (
          <JoinCard token={props.token} onJoined={(name) => setJoinedName(name)} />
        ) : (
          <>
            <RsvpCard
              token={props.token}
              guestName={joinedName}
              currentStatus={props.cachedParticipant?.status ?? null}
            />
            {!isConfirmed && (
              <VoteCard
                token={props.token}
                options={props.payload.options}
                summary={props.payload.votes_summary}
              />
            )}
          </>
        )}

        <ParticipantsList participants={props.payload.participants} />

        {joinedName && (
          <CommentsCard
            token={props.token}
            comments={props.payload.comments}
          />
        )}

        <ShareFooter
          token={props.token}
          appUrl={props.appUrl}
          plan={props.payload.plan}
        />
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
function PlanHeader({
  plan,
  creator,
}: {
  plan: Props['payload']['plan']
  creator: Props['payload']['creator']
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-brand-soft text-brand text-xs">
            {(creator.name ?? 'Q')[0]}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{creator.name ?? 'Alguien'}</span>{' '}
          te invita a este plan
        </p>
      </div>
      <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
        {plan.title ?? 'Plan sin título'}
      </h1>
      {plan.description && (
        <p className="text-muted-foreground">{plan.description}</p>
      )}
      {(plan.location_name || plan.starts_at) && (
        <Card className="bg-background border-border/60">
          <CardContent className="space-y-2 p-4 text-sm">
            {plan.location_name && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <span>
                  {plan.location_name}
                  {plan.address && (
                    <span className="block text-xs text-muted-foreground">{plan.address}</span>
                  )}
                </span>
              </p>
            )}
            {plan.starts_at && (
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                {new Date(plan.starts_at).toLocaleString('es', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function JoinCard({
  token,
  onJoined,
}: {
  token: string
  onJoined: (name: string) => void
}) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/p/${token}/join`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No pudimos sumarte')
        return
      }
      // Cache name in a non-httpOnly cookie for SSR display
      document.cookie = `quedamos_guest_name_${token}=${encodeURIComponent(name.trim())}; max-age=${60 * 60 * 24 * 90}; path=/; SameSite=Lax`
      onJoined(name.trim())
      toast.success(`¡Hola, ${name.trim()}!`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-brand/30 bg-brand-soft/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-4 text-brand" /> ¿Cómo te llamamos?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            autoFocus
            maxLength={60}
            required
          />
          <Button type="submit" disabled={!name.trim() || submitting} className="btn-brand">
            {submitting ? 'Sumando…' : 'Sumarme al plan'}
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          No necesitás cuenta. Tu nombre solo lo ven los del grupo.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function RsvpCard({
  token,
  guestName,
  currentStatus,
}: {
  token: string
  guestName: string
  currentStatus: string | null
}) {
  const [status, setStatus] = useState(currentStatus ?? 'invited')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function set(next: 'going' | 'maybe' | 'not_going') {
    setStatus(next)
    startTransition(async () => {
      const res = await fetch(`/api/p/${token}/rsvp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        toast.error('No se pudo guardar tu respuesta')
        return
      }
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hola {guestName}, ¿vas?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => set('going')}
            disabled={pending}
            className={[
              'rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
              status === 'going'
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border bg-card hover:border-success/40',
            ].join(' ')}
          >
            ✓ Voy
          </button>
          <button
            onClick={() => set('maybe')}
            disabled={pending}
            className={[
              'rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
              status === 'maybe'
                ? 'border-brand/40 bg-brand-soft/30 text-brand'
                : 'border-border bg-card hover:border-brand/40',
            ].join(' ')}
          >
            ~ Maybe
          </button>
          <button
            onClick={() => set('not_going')}
            disabled={pending}
            className={[
              'rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
              status === 'not_going'
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-border bg-card hover:border-destructive/40',
            ].join(' ')}
          >
            ✗ No voy
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function VoteCard({
  token,
  options,
  summary,
}: {
  token: string
  options: Props['payload']['options']
  summary: Props['payload']['votes_summary']
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function vote(optionId: string, value: 'yes' | 'maybe' | 'no') {
    setPending(`${optionId}-${value}`)
    try {
      const res = await fetch(`/api/p/${token}/vote`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ option_id: optionId, vote: value }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'No pudimos guardar tu voto')
        return
      }
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  if (options.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Todavía no hay opciones. Esperá a que el organizador las agregue.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Votá fecha y hora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {options.map((o) => {
          const tally = summary[o.id] ?? { yes: 0, maybe: 0, no: 0 }
          return (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
            >
              <div>
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
                <p className="text-xs text-muted-foreground">
                  ✓ {tally.yes} · ~ {tally.maybe} · ✗ {tally.no}
                </p>
              </div>
              <div className="flex gap-1.5">
                {(['yes', 'maybe', 'no'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => vote(o.id, v)}
                    disabled={!!pending}
                    className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-brand/40 disabled:opacity-50"
                  >
                    {v === 'yes' ? '✓' : v === 'maybe' ? '~' : '✗'}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function ParticipantsList({
  participants,
}: {
  participants: Props['payload']['participants']
}) {
  if (participants.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quiénes están</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs"
            >
              <span>
                {p.status === 'going' ? '✓' : p.status === 'maybe' ? '~' : p.status === 'not_going' ? '✗' : '·'}
              </span>
              {p.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function CommentsCard({
  token,
  comments,
}: {
  token: string
  comments: Props['payload']['comments']
}) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function send() {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/p/${token}/comment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: text.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'No pudimos enviar')
        return
      }
      setText('')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comentarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin comentarios todavía.</p>
        )}
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium text-foreground/90">{c.author_name}</p>
              <p className="text-muted-foreground">{c.body}</p>
            </li>
          ))}
        </ul>
        <Separator />
        <div className="flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí algo…"
            rows={2}
            maxLength={2000}
          />
          <Button
            onClick={send}
            disabled={!text.trim() || submitting}
            size="icon"
            className="btn-brand size-10 self-end"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
function ShareFooter({
  token,
  appUrl,
  plan,
}: {
  token: string
  appUrl: string
  plan: Props['payload']['plan']
}) {
  const url = `${appUrl}/p/${token}`
  const isConfirmed = plan.status === 'confirmed'

  function share() {
    const text = `${plan.title ?? 'Plan'} en Quedamos`
    const nav = typeof navigator !== 'undefined' ? navigator : null
    if (nav && typeof nav.share === 'function') {
      nav.share({ title: text, url, text }).catch(() => {})
    } else if (nav?.clipboard) {
      nav.clipboard.writeText(url).then(
        () => toast.success('Link copiado'),
        () => toast.error('No se pudo copiar'),
      )
    }
  }

  function whatsapp() {
    const text = `${plan.title ?? 'Plan'}\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="outline" onClick={share}>
          <Share2 className="size-4" /> Compartir
        </Button>
        <Button variant="outline" onClick={whatsapp}>
          💬 WhatsApp
        </Button>
        {isConfirmed && plan.starts_at && (
          <a
            href={`/api/plans/${plan.id}/ics?token=${token}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <CalendarDays className="size-4" /> Calendario
          </a>
        )}
      </div>
      {isConfirmed && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <CheckCircle2 className="size-5 text-success" />
            <p>
              <strong>Plan confirmado.</strong> Te llega el recordatorio el día.
            </p>
          </CardContent>
        </Card>
      )}
      <p className="text-center text-xs text-muted-foreground pt-4">
        Hecho con <Link href="/" className="text-brand hover:underline">Quedamos</Link> · Sin pagos, sin caos.
      </p>
    </div>
  )
}
