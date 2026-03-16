'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkline } from './sparkline'
import { BuySellModal } from '@/components/trade/buy-sell-modal'
import { removeFromWatchlist } from '@/lib/actions/watchlist'
import { useSimulationDate } from '@/context/simulation-date'
import { Loader2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SymbolAvatar } from '@/components/ui/symbol-avatar'

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

  const fetchData = useCallback(async () => {
    try {
      const dateParam = simulationDate ? `&date=${simulationDate}` : ''
      const endParam = simulationDate ? `&end_date=${simulationDate}` : ''
      const [quoteRes, tsRes] = await Promise.all([
        fetch(`/api/market/quote?symbol=${symbol}${dateParam}`),
        fetch(`/api/market/timeseries?symbol=${symbol}&interval=1day&outputsize=30${endParam}`),
      ])
      const quoteData = await quoteRes.json()
      const tsData = await tsRes.json()

      setQuote(quoteData)
      if (tsData?.values) {
        const sorted = [...tsData.values].reverse()
        setSparkData(sorted.map((v: { close: string }) => ({ value: parseFloat(v.close) })))
      }
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

  const changeColor = positive ? 'text-green-500' : 'text-red-500'

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-accent/20 transition-colors">

        {/* Symbol + company */}
        <div className="w-52 shrink-0 flex items-center gap-3">
          <SymbolAvatar symbol={symbol} size={36} />
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">{symbol}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{companyName}</p>
          </div>
        </div>

        {/* 1D Change */}
        <div className="w-28 shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className={changeColor}>
              <p className="text-base font-bold leading-tight">
                {positive ? '+' : ''}{fmt(change)}
              </p>
              <p className="text-xs font-medium opacity-80">
                {positive ? '+' : ''}{changePct.toFixed(2)}%
              </p>
            </div>
          )}
        </div>

        {/* 30-day sparkline */}
        <div className="w-36 shrink-0">
          {!loading && <Sparkline data={sparkData} positive={positive} />}
        </div>

        {/* Sell price */}
        <div className="w-28 shrink-0">
          {!loading && price > 0 && (
            <div className="bg-muted rounded-xl px-3 py-1.5 text-center">
              <span className="text-sm font-semibold tabular-nums">{fmt(price)}</span>
            </div>
          )}
        </div>

        {/* Buy price */}
        <div className="w-28 shrink-0">
          {!loading && price > 0 && (
            <div className="bg-muted rounded-xl px-3 py-1.5 text-center">
              <span className="text-sm font-semibold tabular-nums">{fmt(price)}</span>
            </div>
          )}
        </div>

        {/* 52W Range */}
        <div className="flex-1 min-w-0">
          {!loading && week52High > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">{fmt(week52Low)}</span>
                <span className="tabular-nums">{fmt(week52High)}</span>
              </div>
              <div className="h-1 bg-muted rounded-full relative">
                <div
                  className="absolute h-3 w-3 rounded-full bg-foreground border-2 border-background -top-1 -translate-x-1/2 shadow"
                  style={{ left: `${Math.min(Math.max(rangePct, 2), 98)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="rounded-full bg-green-600 hover:bg-green-700 text-white h-8 px-5 font-semibold"
            disabled={loading || price === 0}
            onClick={() => setBuyOpen(true)}
          >
            Buy
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => { await removeFromWatchlist(symbol); router.refresh() }}
              >
                Remove from watchlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
