import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PUBLIC_ENV } from '@/lib/env'

export const metadata = { title: 'Entrar' }

async function sendMagicLink(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !/.+@.+\..+/.test(email)) {
    redirect('/login?error=email_invalid')
  }
  const supabase = await getSupabaseServer()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${PUBLIC_ENV.APP_URL}/auth/callback`,
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
            Entrá a <span className="text-brand">Quedamos</span>
          </CardTitle>
          <CardDescription>
            Te mandamos un link mágico al correo. Sin contraseñas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.sent ? (
            <div className="space-y-3 text-sm">
              <p className="font-medium">Revisá tu correo ✉️</p>
              <p className="text-muted-foreground">
                Mandamos el link a <strong>{params.sent}</strong>. Hacé click para entrar
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
                  placeholder="vos@ejemplo.com"
                />
              </div>
              {params.error && (
                <p className="text-sm text-destructive">
                  {params.error === 'email_invalid' ? 'Ingresá un correo válido.' : params.error}
                </p>
              )}
              <Button type="submit" size="lg" className="btn-brand w-full">
                Mandame el link
              </Button>
              <p className="text-xs text-muted-foreground">
                Al entrar aceptás que coordinemos planes sociales — nada de pagos ni datos
                sensibles.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
