'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addToWatchlist(symbol: string, companyName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('watchlist').upsert(
    { user_id: user.id, symbol: symbol.toUpperCase(), company_name: companyName },
    { onConflict: 'user_id,symbol', ignoreDuplicates: true }
  )

  revalidatePath('/watchlist')
}

export async function removeFromWatchlist(symbol: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('symbol', symbol.toUpperCase())

  revalidatePath('/watchlist')
}
