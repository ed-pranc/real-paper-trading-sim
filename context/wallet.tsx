'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSimulationDate } from '@/context/simulation-date'

interface WalletSummary {
  cash: number
  invested: number
  pnl: number
  total: number
  updatedAt: string | null
}

interface WalletContextValue {
  summary: WalletSummary
  refresh: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

const DEFAULT: WalletSummary = { cash: 0, invested: 0, pnl: 0, total: 0, updatedAt: null }

export function WalletProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [summary, setSummary] = useState<WalletSummary>(DEFAULT)
  const { simulationDate } = useSimulationDate()

  const refresh = useCallback(async () => {
    const supabase = createClient()

    const [walletRes, positionsRes] = await Promise.all([
      supabase.from('wallet_balance').select('cash_balance, updated_at').eq('user_id', userId).single(),
      supabase.from('positions').select('symbol, quantity, avg_buy_price').eq('user_id', userId),
    ])

    const cash = Number(walletRes.data?.cash_balance ?? 0)
    const positions = positionsRes.data ?? []

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
      total: cash + invested + pnl,
      updatedAt: walletRes.data?.updated_at ?? null,
    })
  }, [userId, simulationDate])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <WalletContext.Provider value={{ summary, refresh }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
