// Next 16: este archivo era `middleware.ts`. Ahora se llama `proxy.ts`
// y la función exportada se llama `proxy`. Runtime: nodejs (edge no soportado).
// Refresca la sesión de Supabase en cada request para mantener cookies vivas.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/db-types'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Solo importa el efecto secundario (refresh de cookies) — no usamos el resultado.
  await supabase.auth.getUser()

  return response
}

export const config = {
  // Excluimos estáticos, _next y la propia página pública /p/[token]
  // (esa va con anon-only y no necesita refresh de auth).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}
