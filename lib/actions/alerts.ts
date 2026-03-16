'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PriceAlert {
  id: string
  symbol: string
  target_price: number
  condition: 'above' | 'below'
  created_at: string
}

export async function getAlerts(symbol: string): Promise<PriceAlert[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .order('created_at', { ascending: false })

  return (data ?? []) as PriceAlert[]
}

export async function createAlert(
  symbol: string,
  targetPrice: number,
  condition: 'above' | 'below'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('price_alerts').insert({
    user_id: user.id,
    symbol,
    target_price: targetPrice,
    condition,
  })

  revalidatePath('/', 'layout')
}

export async function deleteAlert(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('price_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
}
