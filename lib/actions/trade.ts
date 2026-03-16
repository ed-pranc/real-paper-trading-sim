'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function executeBuy(
  symbol: string,
  companyName: string,
  quantity: number,
  price: number,
  simulationDate: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const total = quantity * price

  // Check balance
  const { data: wallet } = await supabase
    .from('wallet_balance')
    .select('cash_balance')
    .eq('user_id', user.id)
    .single()

  if (!wallet || Number(wallet.cash_balance) < total) {
    throw new Error('Insufficient funds')
  }

  // Deduct from wallet
  await supabase
    .from('wallet_balance')
    .update({ cash_balance: Number(wallet.cash_balance) - total, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  // Upsert position (weighted average)
  const { data: existing } = await supabase
    .from('positions')
    .select('quantity, avg_buy_price')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .single()

  if (existing) {
    const newQty = Number(existing.quantity) + quantity
    const newAvg = (Number(existing.quantity) * Number(existing.avg_buy_price) + total) / newQty
    await supabase
      .from('positions')
      .update({ quantity: newQty, avg_buy_price: newAvg, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('symbol', symbol)
  } else {
    await supabase.from('positions').insert({
      user_id: user.id,
      symbol,
      company_name: companyName,
      quantity,
      avg_buy_price: price,
    })
  }

  // Log transaction
  await supabase.from('transactions').insert({
    user_id: user.id,
    symbol,
    company_name: companyName,
    type: 'buy',
    quantity,
    price,
    total,
    trade_date: new Date().toISOString(),
    simulation_date: simulationDate,
  })

  revalidatePath('/', 'layout')
}

export async function executeSell(
  symbol: string,
  companyName: string,
  quantity: number,
  price: number,
  simulationDate: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check position
  const { data: position } = await supabase
    .from('positions')
    .select('quantity, avg_buy_price')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .single()

  if (!position || Number(position.quantity) < quantity) {
    throw new Error('Insufficient shares')
  }

  const total = quantity * price
  const pnl = (price - Number(position.avg_buy_price)) * quantity

  // Credit wallet
  const { data: wallet } = await supabase
    .from('wallet_balance')
    .select('cash_balance')
    .eq('user_id', user.id)
    .single()

  await supabase
    .from('wallet_balance')
    .update({ cash_balance: Number(wallet!.cash_balance) + total, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  // Update or delete position
  const remainingQty = Number(position.quantity) - quantity
  if (remainingQty <= 0.000001) {
    await supabase.from('positions').delete().eq('user_id', user.id).eq('symbol', symbol)
  } else {
    await supabase
      .from('positions')
      .update({ quantity: remainingQty, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('symbol', symbol)
  }

  // Log transaction
  await supabase.from('transactions').insert({
    user_id: user.id,
    symbol,
    company_name: companyName,
    type: 'sell',
    quantity,
    price,
    total,
    pnl,
    trade_date: new Date().toISOString(),
    simulation_date: simulationDate,
  })

  revalidatePath('/', 'layout')
}
