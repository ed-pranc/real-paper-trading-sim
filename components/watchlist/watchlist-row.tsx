'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkline } from './sparkline'
import { BuySellModal } from '@/components/trade/buy-sell-modal'
import { removeFromWatchlist } from '@/lib/actions/watchlist'
import { Loader2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SymbolAvatar } from '@/components/ui/symbol-avatar'
import { StockDetailSheet } from '@/components/stock/stock-detail-sheet'
import type { BatchPriceData } from '@/app/api/market/prices/route'

interface WatchlistRowProps {
  symbol: string
  companyName: string
  priceData?: BatchPriceData
  priceLoading: boolean
  lastUpdated: string | null
  simulationDate: string | null
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function WatchlistRow({
  symbol,
  companyName,
  priceData,
  priceLoading,
  lastUpdated,
  simulationDate,
}: WatchlistRowProps) {
  const router = useRouter()
  const [sparkData, setSparkData] = useState<{ value: number }[]>([])
  const [buyOpen, setBuyOpen] = useState(false)

  // Sparkline fetches independently — it's low-priority and staggered naturally
  const fetchSparkline = useCallback(async () => {
    const endParam = simulationDate ? `&end_date=${simulationDate}` : ''
    try {
      const res = await fetch(`/api/market/timeseries?symbol=${symbol}&interval=1day&outputsize=30${endParam}`)
      const data = await res.json()
      if (data?.values) {
        const sorted = [...data.values].reverse()
        setSparkData(sorted.map((v: { close: string }) => ({ value: parseFloat(v.close) })))
      }
    } catch {
      // sparkline failure is silent
    }
  }, [symbol, simulationDate])

  useEffect(() => {
    fetchSparkline()
    // Historical sparklines don't change — only poll in live mode
    if (simulationDate) return
    const interval = setInterval(fetchSparkline, 60_000)
    return () => clearInterval(interval)
  }, [fetchSparkline, simulationDate])

  const price = priceData?.price ?? 0
  const change = priceData?.change ?? 0
  const changePct = priceData?.changePct ?? 0
  const positive = change >= 0
  const week52Low = parseFloat(priceData?.fifty_two_week?.low ?? '0')
  const week52High = parseFloat(priceData?.fifty_two_week?.high ?? '0')
  const rangePct = week52High > week52Low
    ? ((price - week52Low) / (week52High - week52Low)) * 100
    : 50

  const changeColor = positive ? 'text-green-500' : 'text-red-500'

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-accent/20 transition-colors">

        {/* Symbol + company */}
        <StockDetailSheet symbol={symbol} companyName={companyName} simulationDate={simulationDate}>
          <div className="w-52 shrink-0 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <SymbolAvatar symbol={symbol} size={36} />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight">{symbol}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">{companyName}</p>
            </div>
          </div>
        </StockDetailSheet>

        {/* 1D Change */}
        <div className="w-28 shrink-0">
          {priceLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : priceData?.is_historical ? (
            <div className="text-muted-foreground">
              <p className="text-base font-bold leading-tight">${fmt(price)}</p>
              <p className="text-xs opacity-70">Historical</p>
            </div>
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
          {sparkData.length > 0 && <Sparkline data={sparkData} positive={positive} />}
        </div>

        {/* Sell price */}
        <div className="w-28 shrink-0">
          {!priceLoading && price > 0 && (
            <div className="bg-muted rounded-xl px-3 py-1 text-center">
              <span className="text-sm font-semibold tabular-nums">{fmt(price)}</span>
              {lastUpdated && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Updated {lastUpdated}</p>
              )}
            </div>
          )}
        </div>

        {/* Buy price */}
        <div className="w-28 shrink-0">
          {!priceLoading && price > 0 && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-xl px-3 py-1 text-center">
              <span className="text-sm font-semibold tabular-nums text-green-500">{fmt(price)}</span>
              {lastUpdated && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Updated {lastUpdated}</p>
              )}
            </div>
          )}
        </div>

        {/* 52W Range — hidden in sim mode (historical quote doesn't include 52W data) */}
        <div className="flex-1 min-w-0">
          {!priceLoading && week52High > 0 && (
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
            disabled={priceLoading || price === 0}
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
