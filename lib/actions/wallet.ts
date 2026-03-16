'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const DepositSchema = z.number().positive().max(1_000_000)

/**
 * Deposit virtual funds into the user's wallet.
 * @param {number} amount - Amount to deposit (must be positive, max 1,000,000)
 * @returns {Promise<void>}
 */
export async function depositFunds(amount: number) {
  const parsed = DepositSchema.parse(amount)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: wallet } = await supabase
    .from('wallet_balance')
    .select('cash_balance')
    .eq('user_id', user.id)
    .single()

  const newBalance = (Number(wallet?.cash_balance) || 0) + parsed

  await supabase
    .from('wallet_balance')
    .upsert(
      { user_id: user.id, cash_balance: newBalance, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  revalidatePath('/', 'layout')
}

/**
 * Fetch wallet cash balance and invested amount for a user.
 * P/L is calculated separately with live prices by WalletProvider.
 * @param {string} userId - Supabase user ID
 * @returns {Promise<{ cash: number; invested: number; pnl: number; total: number; updatedAt: string | null }>}
 */
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

  return {
    cash,
    invested,
    pnl: 0,
    total: cash + invested,
    updatedAt,
  }
}
