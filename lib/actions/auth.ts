'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Signs the current user out and redirects to the login page.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Resets all trading data for the current user to zero.
 * Clears deposits, transactions, snapshots, positions, and wallet balance.
 * Keeps user_profile and watchlist untouched.
 * Returns (does not redirect) — caller does a hard window.location reload
 * to flush the client-side WalletContext state.
 */
export async function resetData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const tables = ['wallet_deposits', 'transactions', 'portfolio_snapshots', 'positions']
  for (const table of tables) {
    await supabase.from(table).delete().eq('user_id', user.id)
  }

  await supabase
    .from('wallet_balance')
    .upsert({ user_id: user.id, cash_balance: 0, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  revalidatePath('/', 'layout')
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
