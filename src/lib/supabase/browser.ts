'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/db-types'
import { PUBLIC_ENV } from '@/lib/env'

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowser() {
  if (!cached) {
    cached = createBrowserClient<Database>(
      PUBLIC_ENV.SUPABASE_URL,
      PUBLIC_ENV.SUPABASE_ANON_KEY,
    )
  }
  return cached
}
