'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function depositFunds(amount: number) {
  if (amount <= 0) throw new Error('Amount must be positive')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Fetch current balance
  const { data: wallet } = await supabase
    .from('wallet_balance')
    .select('cash_balance')
    .eq('user_id', user.id)
    .single()

  const newBalance = (Number(wallet?.cash_balance) || 0) + amount

  await supabase
    .from('wallet_balance')
    .upsert(
      { user_id: user.id, cash_balance: newBalance, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  revalidatePath('/', 'layout')
}

export async function getWalletSummary(userId: string) {
  const supabase = await createClient()

  const [walletRes, positionsRes] = await Promise.all([
    supabase.from('wallet_balance').select('cash_balance, updated_at').eq('user_id', userId).single(),
    supabase.from('positions').select('quantity, avg_buy_price').eq('user_id', userId),
  ])

  const cash = Number(walletRes.data?.cash_balance ?? 0)
  const updatedAt = walletRes.data?.updated_at ?? null
  const positions = positionsRes.data ?? []

  const invested = positions.reduce(
    (sum, p) => sum + Number(p.quantity) * Number(p.avg_buy_price),
    0
  )

  // pnl will be calculated with live prices later; 0 for now
  return {
    cash,
    invested,
    pnl: 0,
    total: cash + invested,
    updatedAt,
  }
}
