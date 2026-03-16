'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteAlert } from '@/lib/actions/alerts'

export interface TriggeredAlert {
  id: string
  symbol: string
  target_price: number
  condition: 'above' | 'below'
  currentPrice: number
}

export function usePriceAlertChecker(userId: string) {
  const [triggeredAlert, setTriggeredAlert] = useState<TriggeredAlert | null>(null)

  const check = useCallback(async () => {
    const supabase = createClient()

    // Fetch all active alerts for this user
    const { data: alerts } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)

    if (!alerts || alerts.length === 0) return

    // Batch-fetch current prices for all unique symbols
    const symbols = [...new Set(alerts.map((a: { symbol: string }) => a.symbol))]
    const res = await fetch(`/api/market/prices?symbols=${symbols.join(',')}`)
    if (!res.ok) return
    const prices: Record<string, { price: number }> = await res.json()

    for (const alert of alerts) {
      const price = prices[alert.symbol]?.price
      if (!price) continue

      const triggered =
        (alert.condition === 'above' && price >= alert.target_price) ||
        (alert.condition === 'below' && price <= alert.target_price)

      if (triggered) {
        // Delete from DB first to avoid re-triggering
        await deleteAlert(alert.id)
        setTriggeredAlert({
          id: alert.id,
          symbol: alert.symbol,
          target_price: Number(alert.target_price),
          condition: alert.condition,
          currentPrice: price,
        })
        break // show one dialog at a time
      }
    }
  }, [userId])

  useEffect(() => {
    check()
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [check])

  function dismiss() {
    setTriggeredAlert(null)
  }

  return { triggeredAlert, dismiss }
}
