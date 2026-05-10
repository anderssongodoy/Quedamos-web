import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db-types'
import { PUBLIC_ENV } from '@/lib/env'

// Cliente anon sin cookies — usado en route handlers públicos
// que solo invocan RPCs SECURITY DEFINER (get_public_plan, guest_*).
let cached: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAnon() {
  if (!cached) {
    cached = createClient<Database>(PUBLIC_ENV.SUPABASE_URL, PUBLIC_ENV.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }
  return cached
}
