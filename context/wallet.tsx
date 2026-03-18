'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSimulationDate } from '@/context/simulation-date'

interface WalletSummary {
  cash: number
  invested: number
  pnl: number
  realisedPnl: number
  total: number
  updatedAt: string | null
}

interface WalletContextValue {
  summary: WalletSummary
  refresh: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

const DEFAULT: WalletSummary = { cash: 0, invested: 0, pnl: 0, realisedPnl: 0, total: 0, updatedAt: null }

/**
 * Provides live wallet summary (cash, invested, unrealised P/L) to the dashboard.
 * Refreshes every 60 seconds and on simulation date change.
 * Fetches live or historical prices for each open position to compute P/L.
 * @param {{ children: React.ReactNode; userId: string }} props
 */
export function WalletProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [summary, setSummary] = useState<WalletSummary>(DEFAULT)
  const { simulationDate } = useSimulationDate()

  const refresh = useCallback(async () => {
    const supabase = createClient()

    // In sim mode we replay transactions instead of reading the live positions table,
    // so we get the correct state for the chosen historical date.
    const [walletRes, positionsRes, realisedRes] = await Promise.all([
      supabase.from('wallet_balance').select('cash_balance, updated_at').eq('user_id', userId).single(),
      simulationDate
        ? supabase
            .from('transactions')
            .select('symbol, type, quantity, price, simulation_date, trade_date')
            .eq('user_id', userId)
        : supabase.from('positions').select('symbol, quantity, avg_buy_price').eq('user_id', userId),
      simulationDate
        ? supabase
            .from('transactions')
            .select('pnl')
            .eq('user_id', userId)
            .eq('type', 'sell')
            .not('pnl', 'is', null)
            .lte('simulation_date', simulationDate)
        : supabase
            .from('transactions')
            .select('pnl')
            .eq('user_id', userId)
            .eq('type', 'sell')
            .not('pnl', 'is', null),
    ])

    const cash = Number(walletRes.data?.cash_balance ?? 0)

    // Derive effective positions from transaction replay in sim mode
    let positions: { symbol: string; quantity: number; avg_buy_price: number }[]
    if (simulationDate) {
      type TxRow = { symbol: string; type: string; quantity: number; price: number; simulation_date: string | null; trade_date: string }
      const txs = (positionsRes.data ?? []) as TxRow[]
      const sorted = [...txs].sort((a, b) => {
        const da = a.simulation_date ?? a.trade_date.slice(0, 10)
        const db = b.simulation_date ?? b.trade_date.slice(0, 10)
        return da.localeCompare(db)
      })
      const bySymbol: Record<string, { qty: number; totalCost: number }> = {}
      for (const tx of sorted) {
        const effDate = tx.simulation_date ?? tx.trade_date.slice(0, 10)
        if (effDate > simulationDate) continue
        if (!bySymbol[tx.symbol]) bySymbol[tx.symbol] = { qty: 0, totalCost: 0 }
        const s = bySymbol[tx.symbol]
        const qty = Number(tx.quantity)
        const price = Number(tx.price)
        if (tx.type === 'buy') {
          s.qty += qty
          s.totalCost += qty * price
        } else {
          const avgPrice = s.qty > 0 ? s.totalCost / s.qty : 0
          s.qty -= qty
          s.totalCost -= qty * avgPrice
          if (s.qty < 0) s.qty = 0
          if (s.totalCost < 0) s.totalCost = 0
        }
      }
      positions = Object.entries(bySymbol)
        .filter(([, s]) => s.qty > 0.000001)
        .map(([symbol, s]) => ({
          symbol,
          quantity: s.qty,
          avg_buy_price: s.qty > 0 ? s.totalCost / s.qty : 0,
        }))
    } else {
      positions = (positionsRes.data ?? []) as { symbol: string; quantity: number; avg_buy_price: number }[]
    }

    const realisedPnl = (realisedRes.data ?? []).reduce((sum, t) => sum + Number(t.pnl), 0)

    const invested = positions.reduce(
      (sum, p) => sum + Number(p.quantity) * Number(p.avg_buy_price),
      0
    )

    let pnl = 0
    if (positions.length > 0) {
      try {
        const priceResults = await Promise.all(
          positions.map(p => {
            const dateParam = simulationDate ? `&date=${simulationDate}` : ''
            return fetch(`/api/market/quote?symbol=${p.symbol}${dateParam}`)
              .then(r => r.json())
              .catch(() => null)
          })
        )
        let currentValue = 0
        priceResults.forEach((data, i) => {
          const price = parseFloat(data?.close ?? data?.price ?? '0')
          if (price > 0) {
            currentValue += price * Number(positions[i].quantity)
          } else {
            currentValue += Number(positions[i].quantity) * Number(positions[i].avg_buy_price)
          }
        })
        pnl = currentValue - invested
      } catch {
        // pnl stays 0 on error
      }
    }

    setSummary({
      cash,
      invested,
      pnl,
      realisedPnl,
      total: cash + invested + pnl,
      updatedAt: walletRes.data?.updated_at ?? null,
    })
  }, [userId, simulationDate])

  useEffect(() => {
    async function load() { await refresh() }
    load()
    const interval = setInterval(() => { void refresh() }, 60_000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <WalletContext.Provider value={{ summary, refresh }}>
      {children}
    </WalletContext.Provider>
  )
}

/**
 * Returns the wallet summary and a refresh function.
 * Must be used inside WalletProvider.
 * @returns {{ summary: WalletSummary; refresh: () => void }}
 */
export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
