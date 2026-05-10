# Quedamos

**De screenshot a plan en segundos.** App B2C que convierte capturas, links y mensajes en planes sociales listos para compartir — votar, confirmar y recordar, sin perseguir a nadie en el grupo.

## Stack

- **Next.js 16** (App Router, Turbopack) + Tailwind v4 + shadcn/ui (`base-nova` con `@base-ui/react`)
- **Supabase** — Postgres + RLS + Auth + Realtime. Toda la autorización vive en RLS; los invitados votan sin cuenta vía RPCs `SECURITY DEFINER` (`get_public_plan`, `guest_*`).
- **Claude Haiku 4.5** (principal) → **Sonnet 4.6** (escalado si `source_confidence < 0.7`) vía `@anthropic-ai/sdk`. System prompt fijo con prompt caching.
- **Cloudflare R2** para storage de capturas (compresión + strip EXIF con Sharp).
- Worker IA = Route Handler `/api/process-job` (runtime `nodejs`, `maxDuration` 60s), disparado fire-and-forget desde la upload route con un shared secret.

## Convenciones Next 16 (≠ Next 15)

- `proxy.ts` (era `middleware.ts`); función exportada `proxy()`. Runtime nodejs, edge no soportado.
- `cookies()`, `params`, `searchParams` son **async** — siempre `await`.
- Tipos `PageProps<'/path'>`, `RouteContext<'/path'>` se generan con `next typegen`.
- `next lint` removido — usar `eslint` directo. Turbopack default.

## Desarrollo

```bash
cp .env.example .env.local   # completar con valores reales
pnpm install
pnpm dev                     # http://localhost:3000
```

Otros comandos:

```bash
pnpm build               # build de producción
pnpm type-check          # tsc --noEmit
pnpm lint                # eslint
pnpm exec next typegen   # regenerar PageProps/RouteContext
```

## Estructura

```
proxy.ts                       refresca sesión Supabase
src/app/
  page.tsx                     landing pública
  login/                       magic link (OTP)
  auth/{callback,signout}/
  app/                         área autenticada (layout exige sesión)
    page.tsx                   home con planes del usuario
    new/                       crear plan (imagen / link / texto)
    plans/[id]/                editor + estado "procesando" + ficha + confirmación
  p/[token]/                   vista pública — invitados votan sin cuenta
  api/
    plans/new/                 POST: crea plan+source+job, dispara worker
    plans/[id]/                PATCH ficha · sub-rutas: options, confirm, ics
    process-job/               worker IA (auth: header x-quedamos-worker-secret)
    p/[token]/{join,vote,rsvp,comment}/
src/lib/
  db-types.ts                  tipos generados de la DB + atajos (Plan, PlanOption, …)
  schemas.ts                   schemas Zod (extracción IA + bodies de la API)
  supabase/{browser,server,service,anon}.ts   4 clientes según contexto
  anthropic.ts, extract.ts     Claude + system prompt + cálculo de costo
  timezone.ts                  helpers de zona (MVP: America/Lima fijo)
  r2.ts                        cliente S3 de R2
  og-scrape.ts                 metadata OpenGraph
  env.ts, auth.ts, ics.ts, plan-helpers.ts
src/components/ui/             componentes shadcn
src/components/providers/      QueryProvider (TanStack)
```

## Variables de entorno

Ver `.env.example`. Todas son obligatorias salvo `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`).

## Reglas del producto

- **Nunca** funciones de pagos, cobros, reservas pagadas o facturación (restricción contractual).
- Claude Haiku por defecto; Sonnet solo como escalado.
- Los invitados votan sin crear cuenta.
- Registrar `cost_usd`, `input_tokens`, `output_tokens`, `cache_*_tokens` en `processing_jobs` por cada llamada a Claude.

## Deploy

Ver `DEPLOY.md`. Resumen: conectar el repo a Vercel, setear las env vars (Settings → Environment Variables), deploy. Tras el primer deploy, actualizar `NEXT_PUBLIC_APP_URL` con la URL real y agregarla en Supabase → Auth → Redirect URLs.

## Backlog

Ver `IDEAS_FUTURAS.md` — auto-add a calendario, cierre automático de votación, notificaciones por email, app móvil, etc.
