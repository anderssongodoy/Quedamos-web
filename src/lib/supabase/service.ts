import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db-types'
import { PUBLIC_ENV, serverEnv } from '@/lib/env'

// Cliente con service_role — bypass de RLS.
// Usado solo por el worker IA y endpoints internos. NUNCA exponer al cliente.
let cached: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseService() {
  if (!cached) {
    cached = createClient<Database>(
      PUBLIC_ENV.SUPABASE_URL,
      serverEnv.supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )
  }
  return cached
}
