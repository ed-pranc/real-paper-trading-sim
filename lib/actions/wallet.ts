'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const AmountSchema = z.number().positive().max(1_000_000)

/**
 * Deposit virtual funds into the user's wallet and log to wallet_deposits.
 */
export async function depositFunds(amount: number) {
  const parsed = AmountSchema.parse(amount)

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

  await supabase.from('wallet_deposits').insert({
    user_id: user.id,
    type: 'deposit',
    amount: parsed,
  })

  revalidatePath('/', 'layout')
}

/**
 * Withdraw virtual funds from the user's wallet and log to wallet_deposits.
 * Throws if the user has insufficient cash balance.
 */
export async function withdrawFunds(amount: number) {
  const parsed = AmountSchema.parse(amount)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: wallet } = await supabase
    .from('wallet_balance')
    .select('cash_balance')
    .eq('user_id', user.id)
    .single()

  const current = Number(wallet?.cash_balance) || 0
  if (current < parsed) throw new Error('Insufficient balance')

  await supabase
    .from('wallet_balance')
    .upsert(
      { user_id: user.id, cash_balance: current - parsed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  await supabase.from('wallet_deposits').insert({
    user_id: user.id,
    type: 'withdraw',
    amount: parsed,
  })

  revalidatePath('/', 'layout')
}

/**
 * Fetch deposit/withdrawal history for a user, newest first.
 */
export async function getDepositHistory(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('wallet_deposits')
    .select('id, type, amount, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

/**
 * Fetch wallet cash balance and invested amount for a user.
 * P/L is calculated separately with live prices by WalletProvider.
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
