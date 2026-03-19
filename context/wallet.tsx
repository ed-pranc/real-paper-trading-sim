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
  pricesOk: boolean
}

interface WalletContextValue {
  summary: WalletSummary
  refresh: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

const DEFAULT: WalletSummary = { cash: 0, invested: 0, pnl: 0, realisedPnl: 0, total: 0, updatedAt: null, pricesOk: true }

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

    // Unified model: both LIVE and SIM use transaction replay.
    // effectiveDate = simulationDate (SIM) or today (LIVE).
    // effDate(tx) = tx.simulation_date ?? tx.trade_date.slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    const effectiveDate = simulationDate ?? today

    const [walletRes, txRes, depositsRes] = await Promise.all([
      supabase.from('wallet_balance').select('updated_at').eq('user_id', userId).single(),
      supabase
        .from('transactions')
        .select('symbol, type, quantity, price, total, pnl, simulation_date, trade_date')
        .eq('user_id', userId),
      supabase
        .from('wallet_deposits')
        .select('type, amount')
        .eq('user_id', userId)
        .lte('created_at', `${effectiveDate}T23:59:59.999Z`),
    ])

    type TxRow = { symbol: string; type: string; quantity: number; price: number; total: number; pnl: number | null; simulation_date: string | null; trade_date: string }
    const allTx = (txRes.data ?? []) as TxRow[]
    function effDate(tx: TxRow) { return tx.simulation_date ?? tx.trade_date.slice(0, 10) }

    // Cash = deposits/withdrawals up to effectiveDate + sell proceeds - buy costs up to effectiveDate
    const depositCash = (depositsRes.data ?? []).reduce(
      (sum, d) => sum + (d.type === 'deposit' ? Number(d.amount) : -Number(d.amount)),
      0
    )
    const tradeCash = allTx.reduce((sum, tx) => {
      if (effDate(tx) > effectiveDate) return sum
      return sum + (tx.type === 'sell' ? Number(tx.total) : -Number(tx.total))
    }, 0)
    const cash = depositCash + tradeCash

    // Positions: replay all transactions up to effectiveDate
    const sorted = [...allTx].sort((a, b) => effDate(a).localeCompare(effDate(b)))
    const bySymbol: Record<string, { qty: number; totalCost: number }> = {}
    for (const tx of sorted) {
      if (effDate(tx) > effectiveDate) continue
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
    const positions = Object.entries(bySymbol)
      .filter(([, s]) => s.qty > 0.000001)
      .map(([symbol, s]) => ({
        symbol,
        quantity: s.qty,
        avg_buy_price: s.qty > 0 ? s.totalCost / s.qty : 0,
      }))

    // Realised P/L: closed sell transactions up to effectiveDate
    const realisedPnl = allTx.reduce((sum, tx) => {
      if (tx.type !== 'sell' || tx.pnl == null) return sum
      if (effDate(tx) > effectiveDate) return sum
      return sum + Number(tx.pnl)
    }, 0)

    const invested = positions.reduce(
      (sum, p) => sum + Number(p.quantity) * Number(p.avg_buy_price),
      0
    )

    let pnl = 0
    let pricesOk = true
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
        let failedCount = 0
        priceResults.forEach((data, i) => {
          const price = parseFloat(data?.close ?? data?.price ?? '0')
          if (price > 0) {
            currentValue += price * Number(positions[i].quantity)
          } else {
            failedCount++
            currentValue += Number(positions[i].quantity) * Number(positions[i].avg_buy_price)
          }
        })
        pnl = currentValue - invested
        if (failedCount > 0) pricesOk = false
      } catch {
        pricesOk = false
      }
    }

    setSummary({
      cash,
      invested,
      pnl,
      realisedPnl,
      total: cash + invested + pnl,
      updatedAt: walletRes.data?.updated_at ?? null,
      pricesOk,
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
