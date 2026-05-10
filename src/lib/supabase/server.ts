import 'server-only'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/db-types'
import { PUBLIC_ENV } from '@/lib/env'

// Cliente Supabase para Server Components, Server Actions y Route Handlers.
// Usa cookies del request para mantener la sesión del usuario autenticado.
//
// IMPORTANTE: en Next 16 cookies() es async — siempre await.
export async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createSSRClient<Database>(
    PUBLIC_ENV.SUPABASE_URL,
    PUBLIC_ENV.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Component: no se puede setear cookies acá.
            // El refresh de sesión vive en proxy.ts — esto es esperado.
          }
        },
      },
    },
  )
}
