import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  LinkIcon,
  MessageSquareText,
  CalendarCheck2,
  Vote,
  Share2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <DemoShowcase />
        <HowItWorks />
        <UseCases />
        <Differentiators />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  )
}

// ---------------------------------------------------------------------------
function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-[var(--font-display)] text-xl font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg btn-brand text-base font-semibold">Q</span>
          Quedamos
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Entrar
          </Link>
          <Link href="/login">
            <Button size="lg" className="btn-brand">
              Probar gratis <ArrowRight className="size-4" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-warm pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <Badge variant="outline" className="mb-6 gap-1 border-brand/30 bg-brand-soft/50 text-brand">
          <Sparkles className="size-3" /> Nuevo · IA que entiende tus capturas
        </Badge>
        <h1 className="font-[var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          De screenshot
          <br />
          <span className="text-brand">a plan en segundos.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-7 text-muted-foreground sm:text-xl">
          Subí una captura, pegá un link o copiá un mensaje. Quedamos lo convierte en
          una ficha clara para votar, confirmar y recordar — sin perseguir a nadie en
          el grupo.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/login">
            <Button size="lg" className="btn-brand h-12 px-6 text-base">
              Empezar — es gratis
            </Button>
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex h-12 items-center px-4 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            Ver cómo funciona →
          </a>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Sin instalar nada para tus invitados · Sin pagos · Sin caos en el grupo
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function DemoShowcase() {
  return (
    <section className="border-y border-border/50 bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:gap-16">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Antes</p>
          <div className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
            <div className="space-y-3 font-mono text-sm">
              <div className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                <strong className="text-foreground">Ana:</strong> chicos miren este
                lugar 🍝
              </div>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                <strong className="text-foreground">Ana:</strong>{' '}
                <span className="underline decoration-muted-foreground/40">
                  [imagen.jpg]
                </span>
              </div>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                <strong className="text-foreground">Beto:</strong> el sábado?
              </div>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                <strong className="text-foreground">Caro:</strong> a qué hora?
              </div>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                <strong className="text-foreground">Ana:</strong> 8?
              </div>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                <strong className="text-foreground">Beto:</strong> queda lejos? 😅
              </div>
              <p className="pt-2 text-xs italic text-muted-foreground">… 47 mensajes después, nadie cerró.</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wider text-brand">Después</p>
          <div className="rounded-2xl border border-brand/30 bg-background p-6 shadow-md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Restaurante</p>
                  <h3 className="font-[var(--font-display)] text-xl font-semibold">
                    Cena en La Trattoria 🍝
                  </h3>
                </div>
                <Badge className="bg-brand-soft text-brand">85% confianza</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">📍</span> La Trattoria · Barranco
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">🗓️</span> Sáb 16 May · 20:00
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">👥</span> 4 confirmados · 1 maybe
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="btn-brand flex-1">
                  Voy
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Maybe
                </Button>
                <Button size="sm" variant="ghost">
                  No voy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                quedamos.app/p/abc123 · Tus invitados votan sin cuenta
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function HowItWorks() {
  const steps = [
    { icon: Camera, title: 'Subí la captura', body: 'O pegá un link, o copiá un mensaje. Lo que ya hacés en el grupo.' },
    { icon: Sparkles, title: 'Quedamos la entiende', body: 'Detecta lugar, fecha, hora y arma una ficha editable en segundos.' },
    { icon: Share2, title: 'Compartí el link', body: 'Mandalo al grupo. Tus amigos abren la página — sin instalar nada.' },
    { icon: Vote, title: 'Todos votan y confirmás', body: 'La gente vota fecha y hora, vos cerrás el plan. Listo.' },
  ]
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-brand">Cómo funciona</p>
        <h2 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Cuatro pasos. Cero caos.
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-brand/40"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <s.icon className="size-5" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function UseCases() {
  const items = [
    { e: '🍽️', t: 'Cenas con amigos' },
    { e: '🎬', t: 'Salidas al cine' },
    { e: '🎂', t: 'Cumpleaños casuales' },
    { e: '🎵', t: 'Conciertos pequeños' },
    { e: '🏃', t: 'Planes universitarios' },
    { e: '🌴', t: 'Escapadas de fin de semana' },
    { e: '☕', t: 'Cafés con la familia' },
    { e: '🎉', t: 'Eventos del barrio' },
  ]
  return (
    <section className="bg-muted/40 border-y border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Para todos los planes que tu grupo improvisa.
        </h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.t}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm"
            >
              <span className="text-xl">{it.e}</span>
              <span className="font-medium">{it.t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function Differentiators() {
  const items = [
    { icon: LinkIcon, title: 'Sin instalar para invitados', body: 'Abren un link y ya votan. No App Store, no fricción.' },
    { icon: MessageSquareText, title: 'Sin caos en el grupo', body: 'Una ficha clara reemplaza 47 mensajes desordenados.' },
    { icon: CalendarCheck2, title: 'Calendario en un click', body: 'Apple, Google o el archivo .ics — para que nadie se olvide.' },
    { icon: Sparkles, title: 'IA que cuesta centavos', body: 'Claude Haiku 4.5 + escalado a Sonnet solo cuando hace falta.' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-brand">Por qué Quedamos</p>
        <h2 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          No es otra app de eventos.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Quedamos entra antes que todos: justo cuando aparece la idea del plan.
        </p>
      </div>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2">
        {items.map((d) => (
          <div key={d.title} className="bg-background p-6">
            <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <d.icon className="size-5" />
            </span>
            <h3 className="text-lg font-semibold">{d.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{d.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function ClosingCta() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="rounded-3xl border border-brand/30 bg-brand-soft/40 p-10 text-center sm:p-16">
        <h2 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Empezá a organizar planes
          <br />
          sin perseguir a nadie.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Crear tu primer plan toma menos de 30 segundos. Y tus invitados ni
          siquiera necesitan instalar nada.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/login">
            <Button size="lg" className="btn-brand h-12 px-6 text-base">
              Crear mi primer plan
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <p>
          © {new Date().getFullYear()} Quedamos · Hecho para grupos que ya no quieren
          decir &quot;al final nadie cerró nada&quot;.
        </p>
        <p>De screenshot a plan.</p>
      </div>
    </footer>
  )
}
