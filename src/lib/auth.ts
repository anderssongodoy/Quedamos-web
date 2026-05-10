import 'server-only'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function getUser(): Promise<User | null> {
  const supabase = await getSupabaseServer()
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function requireUser(): Promise<User> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}
