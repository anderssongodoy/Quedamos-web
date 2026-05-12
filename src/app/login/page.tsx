import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PUBLIC_ENV } from '@/lib/env'

export const metadata = { title: 'Entrar' }

// El origen REAL desde el que se pidió el login — así el magic link siempre
// apunta al sitio correcto (localhost en local, el dominio de Vercel en prod),
// sin depender de NEXT_PUBLIC_APP_URL que se hornea en el build.
async function currentOrigin(): Promise<string> {
  const h = await headers()
  const origin = h.get('origin')
  if (origin) return origin
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return PUBLIC_ENV.APP_URL
}

async function sendMagicLink(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !/.+@.+\..+/.test(email)) {
    redirect('/login?error=email_invalid')
  }
  const origin = await currentOrigin()
  const supabase = await getSupabaseServer()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  redirect(`/login?sent=${encodeURIComponent(email)}`)
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const params = await searchParams
  return (
    <main className="min-h-screen flex items-center justify-center px-6 gradient-warm">
      <Card className="w-full max-w-sm border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">
            Entra a <span className="text-brand">Quedamos</span>
          </CardTitle>
          <CardDescription>
            Te enviamos un link mágico al correo. Sin contraseñas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.sent ? (
            <div className="space-y-3 text-sm">
              <p className="font-medium">Revisa tu correo ✉️</p>
              <p className="text-muted-foreground">
                Enviamos el link a <strong>{params.sent}</strong>. Haz clic para entrar
                (puede tardar un minuto).
              </p>
              <Link
                href="/login"
                className="text-brand underline-offset-4 hover:underline text-sm"
              >
                Probar con otro correo
              </Link>
            </div>
          ) : (
            <form action={sendMagicLink} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@ejemplo.com"
                />
              </div>
              {params.error && (
                <p className="text-sm text-destructive">
                  {params.error === 'email_invalid' ? 'Ingresa un correo válido.' : params.error}
                </p>
              )}
              <Button type="submit" size="lg" className="btn-brand w-full">
                Enviarme el link
              </Button>
              <p className="text-xs text-muted-foreground">
                Al entrar aceptas que coordinemos planes sociales — nada de pagos ni datos
                sensibles.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
