'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Replay all sim transactions for a user/symbol up to simulationDate
 * to compute the weighted-average cost basis and remaining quantity.
 * Uses the same WAC algorithm as wallet.tsx and portfolio-client.tsx.
 */
async function computeSimAvgBuyPrice(
  supabase: SupabaseClient,
  userId: string,
  symbol: string,
  simulationDate: string
): Promise<{ qty: number; avgPrice: number }> {
  const { data: txs } = await supabase
    .from('transactions')
    .select('type, quantity, price, simulation_date, trade_date')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .not('simulation_date', 'is', null)
    .lte('simulation_date', simulationDate)
    .order('simulation_date', { ascending: true })

  let qty = 0, totalCost = 0
  for (const tx of txs ?? []) {
    const q = Number(tx.quantity), p = Number(tx.price)
    if (tx.type === 'buy') {
      qty += q
      totalCost += q * p
    } else {
      const avg = qty > 0 ? totalCost / qty : 0
      qty -= q
      totalCost -= q * avg
      if (qty < 0) qty = 0
      if (totalCost < 0) totalCost = 0
    }
  }
  return { qty, avgPrice: qty > 0 ? totalCost / qty : 0 }
}

/**
 * Saves a portfolio snapshot after a live trade.
 * Skipped entirely for sim trades — sim positions are derived from transaction
 * replay, and cost-basis snapshots would produce misleading chart data.
 *
 * NOTE: total_value is stored as cash + cost_basis (qty × avgBuyPrice),
 * NOT cash + market_value. This means the "Portfolio Value Over Time" chart
 * reflects capital deployed, not actual portfolio performance — it will appear
 * flat between trades even as market prices change. A future "lazy snapshot
 * refresh" mechanism should overwrite these rows with real market prices once
 * they are available on the client side.
 */
async function savePortfolioSnapshot(
  supabase: SupabaseClient,
  userId: string,
  simulationDate: string | null
) {
  if (simulationDate) return   // sim trades produce no meaningful cost-basis snapshot

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
    snapshot_date: new Date().toISOString().split('T')[0],
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
 *
 * Sim mode (simulationDate set):
 *   - Records the transaction with simulation_date.
 *   - Does NOT touch wallet_balance or positions — those are maintained via
 *     transaction replay in wallet.tsx and portfolio-client.tsx.
 *
 * Live mode (simulationDate null):
 *   - Deducts from wallet_balance.cash_balance.
 *   - Upserts the positions table.
 *   - Saves a portfolio snapshot.
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

  if (!parsed.simulationDate) {
    // Live mode: validate and deduct real cash, update live positions
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
 *
 * Sim mode (simulationDate set):
 *   - Replays transactions to derive qty and avg_buy_price for this symbol.
 *   - Records the transaction with computed P/L and simulation_date.
 *   - Does NOT touch wallet_balance or positions.
 *
 * Live mode (simulationDate null):
 *   - Reads avg_buy_price from positions table.
 *   - Credits wallet_balance.
 *   - Reduces or deletes the positions row.
 *   - Saves a portfolio snapshot.
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

  const total = parsed.quantity * parsed.price
  let pnl: number

  if (parsed.simulationDate) {
    // Sim mode: derive position from transaction replay
    const { qty, avgPrice } = await computeSimAvgBuyPrice(
      supabase, user.id, parsed.symbol, parsed.simulationDate
    )
    if (qty < parsed.quantity - 0.000001) {
      throw new Error('Insufficient shares')
    }
    pnl = (parsed.price - avgPrice) * parsed.quantity
  } else {
    // Live mode: read positions, credit wallet, update positions table
    const { data: position } = await supabase
      .from('positions')
      .select('quantity, avg_buy_price')
      .eq('user_id', user.id)
      .eq('symbol', parsed.symbol)
      .single()

    if (!position || Number(position.quantity) < parsed.quantity) {
      throw new Error('Insufficient shares')
    }

    pnl = (parsed.price - Number(position.avg_buy_price)) * parsed.quantity

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
