'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

interface Recommendation {
  period: string
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
  consensus: string
}

const CONSENSUS_COLOR: Record<string, string> = {
  'Strong Buy': 'bg-emerald-600 text-white',
  'Buy': 'bg-green-500 text-white',
  'Hold': 'bg-amber-500 text-white',
  'Sell': 'bg-red-500 text-white',
  'Strong Sell': 'bg-red-700 text-white',
  'N/A': 'bg-muted text-muted-foreground',
}

const BAR_COLOR: Record<string, string> = {
  strongBuy: 'bg-emerald-500',
  buy: 'bg-green-400',
  hold: 'bg-amber-400',
  sell: 'bg-red-400',
  strongSell: 'bg-red-600',
}

export function AnalystForecast({ symbol }: { symbol: string }) {
  const [data, setData] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/market/analyst?symbol=${symbol}`)
        const json = await res.json()
        if (!cancelled) setData(json ?? null)
      } catch {
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [symbol])

  const bars: { key: keyof Recommendation; label: string }[] = [
    { key: 'strongBuy', label: 'Strong Buy' },
    { key: 'buy', label: 'Buy' },
    { key: 'hold', label: 'Hold' },
    { key: 'sell', label: 'Sell' },
    { key: 'strongSell', label: 'Strong Sell' },
  ]

  const total = data
    ? (data.strongBuy + data.buy + data.hold + data.sell + data.strongSell)
    : 0

  return (
    <div className="px-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Analyst Forecast</p>
        {loading ? (
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        ) : data ? (
          <Badge className={`text-xs ${CONSENSUS_COLOR[data.consensus] ?? CONSENSUS_COLOR['N/A']}`}>
            {data.consensus}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Unavailable</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 bg-muted rounded w-16" />
              <div className="h-2 bg-muted rounded flex-1" />
              <div className="h-3 bg-muted rounded w-4" />
            </div>
          ))}
        </div>
      ) : data && total > 0 ? (
        <div className="space-y-1.5">
          {bars.map(({ key, label }) => {
            const val = data[key] as number
            const pct = total > 0 ? (val / total) * 100 : 0
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAR_COLOR[key]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-4 text-right text-muted-foreground">{val}</span>
              </div>
            )
          })}
          {data.period && (
            <p className="text-[10px] text-muted-foreground pt-1">Based on {total} analysts · {data.period}</p>
          )}
        </div>
      ) : !loading ? (
        <p className="text-sm text-muted-foreground">No analyst data available.</p>
      ) : null}
    </div>
  )
}
