'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkline } from './sparkline'
import { BuySellModal } from '@/components/trade/buy-sell-modal'
import { removeFromWatchlist } from '@/lib/actions/watchlist'
import { useSimulationDate } from '@/context/simulation-date'
import { Trash2, Loader2 } from 'lucide-react'

interface WatchlistRowProps {
  symbol: string
  companyName: string
}

interface QuoteData {
  close?: string
  price?: string
  change?: string
  percent_change?: string
  fifty_two_week?: { low: string; high: string }
  open?: string
  high?: string
  low?: string
  is_historical?: boolean
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function WatchlistRow({ symbol, companyName }: WatchlistRowProps) {
  const { simulationDate } = useSimulationDate()
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [sparkData, setSparkData] = useState<{ value: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [buyOpen, setBuyOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const dateParam = simulationDate ? `&date=${simulationDate}` : ''
      const [quoteRes, tsRes] = await Promise.all([
        fetch(`/api/market/quote?symbol=${symbol}${dateParam}`),
        fetch(`/api/market/timeseries?symbol=${symbol}&interval=1h&outputsize=24${simulationDate ? `&end_date=${simulationDate}` : ''}`),
      ])
      const quoteData = await quoteRes.json()
      const tsData = await tsRes.json()

      setQuote(quoteData)
      if (tsData?.values) {
        const sorted = [...tsData.values].reverse()
        setSparkData(sorted.map((v: { close: string }) => ({ value: parseFloat(v.close) })))
      }
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [symbol, simulationDate])

  useEffect(() => {
    setLoading(true)
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const price = parseFloat(quote?.close ?? quote?.price ?? '0')
  const change = parseFloat(quote?.change ?? '0')
  const changePct = parseFloat(quote?.percent_change ?? '0')
  const positive = change >= 0
  const week52Low = parseFloat(quote?.fifty_two_week?.low ?? '0')
  const week52High = parseFloat(quote?.fifty_two_week?.high ?? '0')
  const rangePct = week52High > week52Low
    ? ((price - week52Low) / (week52High - week52Low)) * 100
    : 50

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors">
        {/* Symbol + name */}
        <div className="w-48 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
              {symbol.slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-sm">{symbol}</p>
              <p className="text-xs text-muted-foreground truncate max-w-32">{companyName}</p>
            </div>
          </div>
        </div>

        {/* Change 1D */}
        <div className="w-24 shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className={positive ? 'text-green-500' : 'text-red-500'}>
              <p className="text-sm font-medium">{positive ? '+' : ''}{fmt(change)}</p>
              <p className="text-xs">({positive ? '+' : ''}{changePct.toFixed(2)}%)</p>
            </div>
          )}
        </div>

        {/* Sparkline */}
        <div className="w-24 shrink-0">
          <Sparkline data={sparkData} positive={positive} />
        </div>

        {/* Sell price (red) */}
        <div className="w-28 shrink-0">
          {loading ? null : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1 text-center">
              <span className="text-sm font-semibold text-red-400">{fmt(price)}</span>
            </div>
          )}
        </div>

        {/* Buy price (green) */}
        <div className="w-28 shrink-0">
          {loading ? null : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1 text-center">
              <span className="text-sm font-semibold text-green-400">{fmt(price)}</span>
            </div>
          )}
        </div>

        {/* 52W Range */}
        <div className="flex-1 min-w-0">
          {!loading && week52High > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fmt(week52Low)}</span>
                <span>{fmt(week52High)}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full relative">
                <div
                  className="absolute h-2.5 w-2.5 rounded-full bg-foreground border-2 border-background -top-0.5 -translate-x-1/2"
                  style={{ left: `${Math.min(Math.max(rangePct, 2), 98)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div className="hidden xl:block text-xs text-muted-foreground w-28 shrink-0 text-right">
            {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="rounded-full bg-green-600 hover:bg-green-700 text-white h-8 px-4"
            disabled={loading || price === 0}
            onClick={() => setBuyOpen(true)}
          >
            Buy
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={async () => { await removeFromWatchlist(symbol); router.refresh() }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BuySellModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        symbol={symbol}
        companyName={companyName}
        price={price}
        mode="buy"
      />
    </>
  )
}
