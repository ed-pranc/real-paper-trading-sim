'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

/**
 * Signs the current user out and redirects to the login page.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Permanently deletes the current user's account and all associated data.
 * Deletes DB rows in dependency order, then removes the auth user via admin client.
 * Redirects to /login on success.
 */
export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete all user data — order matters for FK constraints
  const tables = [
    'wallet_deposits',
    'transactions',
    'portfolio_snapshots',
    'positions',
    'wallet_balance',
    'user_profile',
  ]
  for (const table of tables) {
    await supabase.from(table).delete().eq('user_id', user.id)
  }

  // Delete the auth user — requires service role key
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(user.id)

  redirect('/login')
}
