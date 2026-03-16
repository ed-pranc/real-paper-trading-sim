'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Saves a portfolio snapshot after a trade.
 * total_value = cash + sum(position.quantity × avg_buy_price).
 * This is accurate at trade time because the just-traded shares were priced at market.
 */
async function savePortfolioSnapshot(
  supabase: SupabaseClient,
  userId: string,
  simulationDate: string | null
) {
  const [walletRes, positionsRes] = await Promise.all([
    supabase.from('wallet_balance').select('cash_balance').eq('user_id', userId).single(),
    supabase.from('positions').select('quantity, avg_buy_price').eq('user_id', userId),
  ])

  const cash = Number(walletRes.data?.cash_balance ?? 0)
  const invested = (positionsRes.data ?? []).reduce(
    (sum, p) => sum + Number(p.quantity) * Number(p.avg_buy_price),
    0
  )

  await supabase.from('portfolio_snapshots').insert({
    user_id: userId,
    cash,
    invested,
    pnl: 0,
    total_value: cash + invested,
    snapshot_date: simulationDate ?? new Date().toISOString().split('T')[0],
  })
}

const TradeSchema = z.object({
  symbol: z.string().min(1),
  companyName: z.string().min(1),
  quantity: z.number().positive(),
  price: z.number().positive(),
  simulationDate: z.string().nullable(),
})

/**
 * Execute a buy order for a stock position.
 * @param {string} symbol - Ticker symbol
 * @param {string} companyName - Full company name
 * @param {number} quantity - Number of shares to buy
 * @param {number} price - Price per share
 * @param {string | null} simulationDate - ISO date string for sim mode, or null for live
 * @returns {Promise<void>}
 */
export async function executeBuy(
  symbol: string,
  companyName: string,
  quantity: number,
  price: number,
  simulationDate: string | null
) {
  const parsed = TradeSchema.parse({ symbol, companyName, quantity, price, simulationDate })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const total = parsed.quantity * parsed.price

  const { data: wallet } = await supabase
    .from('wallet_balance')
    .select('cash_balance')
    .eq('user_id', user.id)
    .single()

  if (!wallet || Number(wallet.cash_balance) < total) {
    throw new Error('Insufficient funds')
  }

  await supabase
    .from('wallet_balance')
    .update({ cash_balance: Number(wallet.cash_balance) - total, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  const { data: existing } = await supabase
    .from('positions')
    .select('quantity, avg_buy_price')
    .eq('user_id', user.id)
    .eq('symbol', parsed.symbol)
    .single()

  if (existing) {
    const newQty = Number(existing.quantity) + parsed.quantity
    const newAvg = (Number(existing.quantity) * Number(existing.avg_buy_price) + total) / newQty
    await supabase
      .from('positions')
      .update({ quantity: newQty, avg_buy_price: newAvg, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('symbol', parsed.symbol)
  } else {
    await supabase.from('positions').insert({
      user_id: user.id,
      symbol: parsed.symbol,
      company_name: parsed.companyName,
      quantity: parsed.quantity,
      avg_buy_price: parsed.price,
    })
  }

  await supabase.from('transactions').insert({
    user_id: user.id,
    symbol: parsed.symbol,
    company_name: parsed.companyName,
    type: 'buy',
    quantity: parsed.quantity,
    price: parsed.price,
    total,
    trade_date: new Date().toISOString(),
    simulation_date: parsed.simulationDate,
  })

  await savePortfolioSnapshot(supabase, user.id, parsed.simulationDate)

  revalidatePath('/', 'layout')
}

/**
 * Execute a sell order, crediting the wallet and recording P/L.
 * @param {string} symbol - Ticker symbol
 * @param {string} companyName - Full company name
 * @param {number} quantity - Number of shares to sell
 * @param {number} price - Price per share
 * @param {string | null} simulationDate - ISO date string for sim mode, or null for live
 * @returns {Promise<void>}
 */
export async function executeSell(
  symbol: string,
  companyName: string,
  quantity: number,
  price: number,
  simulationDate: string | null
) {
  const parsed = TradeSchema.parse({ symbol, companyName, quantity, price, simulationDate })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: position } = await supabase
    .from('positions')
    .select('quantity, avg_buy_price')
    .eq('user_id', user.id)
    .eq('symbol', parsed.symbol)
    .single()

  if (!position || Number(position.quantity) < parsed.quantity) {
    throw new Error('Insufficient shares')
  }

  const total = parsed.quantity * parsed.price
  const pnl = (parsed.price - Number(position.avg_buy_price)) * parsed.quantity

  const { data: wallet } = await supabase
    .from('wallet_balance')
    .select('cash_balance')
    .eq('user_id', user.id)
    .single()

  await supabase
    .from('wallet_balance')
    .update({ cash_balance: Number(wallet!.cash_balance) + total, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  const remainingQty = Number(position.quantity) - parsed.quantity
  if (remainingQty <= 0.000001) {
    await supabase.from('positions').delete().eq('user_id', user.id).eq('symbol', parsed.symbol)
  } else {
    await supabase
      .from('positions')
      .update({ quantity: remainingQty, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('symbol', parsed.symbol)
  }

  await supabase.from('transactions').insert({
    user_id: user.id,
    symbol: parsed.symbol,
    company_name: parsed.companyName,
    type: 'sell',
    quantity: parsed.quantity,
    price: parsed.price,
    total,
    pnl,
    trade_date: new Date().toISOString(),
    simulation_date: parsed.simulationDate,
  })

  await savePortfolioSnapshot(supabase, user.id, parsed.simulationDate)

  revalidatePath('/', 'layout')
}
