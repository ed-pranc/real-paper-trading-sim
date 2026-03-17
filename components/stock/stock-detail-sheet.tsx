'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { SymbolAvatar } from '@/components/ui/symbol-avatar'
import { StockChart } from '@/components/trade/stock-chart'
import { AnalystForecast } from '@/components/stock/analyst-forecast'
import { PriceAlertSetter } from '@/components/stock/price-alert-setter'
import { StockNews } from '@/components/stock/stock-news'

interface QuoteData {
  close?: number
  price?: number
  change?: number
  percent_change?: number
  fifty_two_week?: { low: string; high: string; range: string }
  volume?: string
  average_volume?: string
  day_low?: string
  day_high?: string
  is_historical?: boolean
}

interface StockDetailSheetProps {
  symbol: string
  companyName: string
  simulationDate: string | null
  children: ReactNode
}

export function StockDetailSheet({ symbol, companyName, simulationDate, children }: StockDetailSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadQuote() {
      try {
        const params = new URLSearchParams({ symbol })
        if (simulationDate) params.set('date', simulationDate)
        const res = await fetch(`/api/market/quote?${params}`)
        const data = await res.json()
        if (!cancelled) setQuote(data)
      } catch {
        // ignore
      }
    }
    loadQuote()
    return () => { cancelled = true }
  }, [open, symbol, simulationDate])

  const price = Number(quote?.close ?? quote?.price ?? 0)
  const change = Number(quote?.change ?? 0)
  const pct = Number(quote?.percent_change ?? 0)
  const isPositive = change >= 0
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500'

  const fiftyTwoLow = quote?.fifty_two_week?.low ? parseFloat(quote.fifty_two_week.low) : null
  const fiftyTwoHigh = quote?.fifty_two_week?.high ? parseFloat(quote.fifty_two_week.high) : null
  const fiftyTwoProgress = fiftyTwoLow && fiftyTwoHigh && price
    ? Math.max(0, Math.min(100, ((price - fiftyTwoLow) / (fiftyTwoHigh - fiftyTwoLow)) * 100))
    : null

  const vol = quote?.volume ? Number(quote.volume).toLocaleString() : null
  const dayLow = quote?.day_low ? parseFloat(quote.day_low).toFixed(2) : null
  const dayHigh = quote?.day_high ? parseFloat(quote.day_high).toFixed(2) : null

  if (!mounted) return <>{children}</>

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto p-0 gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-3 pr-8">
            <SymbolAvatar symbol={symbol} size={44} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base font-bold">{symbol}</SheetTitle>
                {simulationDate && (
                  <Badge variant="secondary" className="text-[10px]">SIM</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{companyName}</p>
            </div>
            {price > 0 && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">${price.toFixed(2)}</p>
                {quote && !quote.is_historical && (
                  <p className={`text-xs ${changeColor}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{pct.toFixed(2)}%)
                  </p>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Performance Chart */}
          <div className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Performance</p>
            <StockChart symbol={symbol} simulationDate={simulationDate} />
          </div>

          <Separator />

          {/* Key Stats */}
          {(fiftyTwoLow || vol || dayLow) && (
            <>
              <div className="px-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key Stats</p>
                {fiftyTwoLow && fiftyTwoHigh && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>52W Range</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-14 shrink-0">${fiftyTwoLow.toFixed(2)}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full relative">
                        {fiftyTwoProgress !== null && (
                          <div
                            className="absolute top-0 h-full w-1.5 -translate-x-1/2 bg-foreground rounded-full"
                            style={{ left: `${fiftyTwoProgress}%` }}
                          />
                        )}
                      </div>
                      <span className="text-muted-foreground w-14 text-right shrink-0">${fiftyTwoHigh.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {dayLow && dayHigh && (
                    <div>
                      <p className="text-muted-foreground">Day&apos;s Range</p>
                      <p className="font-medium">${dayLow} – ${dayHigh}</p>
                    </div>
                  )}
                  {vol && (
                    <div>
                      <p className="text-muted-foreground">Volume</p>
                      <p className="font-medium">{vol}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Price Alerts */}
          <PriceAlertSetter symbol={symbol} currentPrice={price} />

          <Separator />

          {/* Analyst Forecast */}
          <AnalystForecast symbol={symbol} />

          <Separator />

          {/* News */}
          <StockNews symbol={symbol} simulationDate={simulationDate} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
