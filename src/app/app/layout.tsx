import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getSupabaseServer } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, avatar_url')
    .eq('id', userData.user.id)
    .maybeSingle()

  const displayName = profile?.name ?? userData.user.email ?? 'Tú'
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/app" className="flex items-center gap-2 font-[var(--font-display)] text-lg font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md btn-brand text-sm">Q</span>
            Quedamos
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/app/new">
              <Button size="sm" className="btn-brand">+ Nuevo plan</Button>
            </Link>
            <form action="/auth/signout" method="post" className="contents">
              <button
                type="submit"
                className="rounded-full transition-opacity hover:opacity-80"
                title={`${displayName} · cerrar sesión`}
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-brand-soft text-brand text-xs">
                    {initials || 'Q'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
