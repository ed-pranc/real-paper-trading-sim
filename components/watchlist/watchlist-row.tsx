'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sparkline } from './sparkline'
import { BuySellModal } from '@/components/trade/buy-sell-modal'
import { removeFromWatchlist } from '@/lib/actions/watchlist'
import { Loader2, Trash2, FastForward } from 'lucide-react'
import { SymbolAvatar } from '@/components/ui/symbol-avatar'
import { StockDetailSheet } from '@/components/stock/stock-detail-sheet'
import type { BatchPriceData } from '@/app/api/market/prices/route'
import { fmtDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useSimulationDate } from '@/context/simulation-date'

interface WatchlistRowProps {
  symbol: string
  companyName: string
  priceData?: BatchPriceData
  priceLoading: boolean
  simulationDate: string | null
  listedDate?: string | null
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function WatchlistRow({
  symbol,
  companyName,
  priceData,
  priceLoading,
  simulationDate,
  listedDate,
}: WatchlistRowProps) {
  const router = useRouter()
  const { setSimulationDate } = useSimulationDate()
  const [sparkData, setSparkData] = useState<{ value: number; datetime: string }[]>([])
  const [buyOpen, setBuyOpen] = useState(false)

  const fetchSparkline = useCallback(async () => {
    const endParam = simulationDate ? `&end_date=${simulationDate}` : ''
    try {
      const res = await fetch(`/api/market/timeseries?symbol=${symbol}&interval=1day&outputsize=260${endParam}`)
      const data = await res.json()
      if (data?.values) {
        const sorted = [...data.values].reverse()
        setSparkData(sorted.map((v: { datetime: string; close: string }) => ({
          value: parseFloat(v.close),
          datetime: v.datetime,
        })))
      }
    } catch {
      // sparkline failure is silent
    }
  }, [symbol, simulationDate])

  useEffect(() => {
    fetchSparkline()
  }, [fetchSparkline])

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
  // Stock is unavailable if its listing date is after the simulation date.
  // listedDate and simulationDate are both YYYY-MM-DD so string comparison is correct.
  const unavailable = !!simulationDate && !!listedDate && listedDate > simulationDate
  const dim = unavailable ? 'opacity-40' : ''

  return (
    <>
      <TableRow>
        {/* Symbol + company */}
        <TableCell className={dim}>
          <StockDetailSheet symbol={symbol} companyName={companyName} simulationDate={simulationDate}>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <SymbolAvatar symbol={symbol} size={36} />
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">{symbol}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{companyName}</p>
              </div>
            </div>
          </StockDetailSheet>
        </TableCell>

        {/* 1D Change */}
        <TableCell className={dim}>
          {!unavailable && (priceLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : priceData?.is_historical ? (
            <div className="text-muted-foreground">
              <p className="text-base font-bold leading-tight tabular-nums">${fmt(price)}</p>
              <p className="text-xs opacity-70">Historical</p>
            </div>
          ) : (
            <div className={changeColor}>
              <p className="text-base font-bold leading-tight tabular-nums">
                {positive ? '+' : ''}{fmt(change)}
              </p>
              <p className="text-xs font-medium opacity-80 tabular-nums">
                {positive ? '+' : ''}{changePct.toFixed(2)}%
              </p>
            </div>
          ))}
        </TableCell>

        {/* 1Y Sparkline */}
        <TableCell className={`w-56 ${dim}`}>
          {!unavailable && sparkData.length > 0 && <Sparkline data={sparkData} positive={positive} />}
        </TableCell>

        {/* Buy price pill */}
        <TableCell className={dim}>
          {!unavailable && !priceLoading && price > 0 && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-xl px-3 py-1 text-center w-fit">
              <span className="text-sm font-semibold tabular-nums text-green-500">{fmt(price)}</span>
            </div>
          )}
        </TableCell>

        {/* 52W Range */}
        <TableCell className={`min-w-[160px] ${dim}`}>
          {!unavailable && !priceLoading && week52High > 0 && (
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
        </TableCell>

        {/* Trading Since — full opacity; shows jump button when unavailable */}
        <TableCell>
          {listedDate ? (
            unavailable ? (
              <div className="flex items-center gap-1.5">
                <Badge className="bg-red-600 text-white hover:bg-red-600 text-xs tabular-nums font-medium">
                  {fmtDate(listedDate)}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => setSimulationDate(listedDate)}
                    >
                      <FastForward className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Jump to {fmtDate(listedDate)} — first day {symbol} traded</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums">{fmtDate(listedDate)}</span>
            )
          ) : <span className="text-xs text-muted-foreground">—</span>}
        </TableCell>

        {/* Actions — full opacity; delete always active */}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="rounded-full bg-green-600 hover:bg-green-700 text-white h-8 px-5 font-semibold"
                  disabled={priceLoading || price === 0 || unavailable}
                  onClick={() => setBuyOpen(true)}
                >
                  Buy
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {unavailable ? 'Not yet listed on this date' : `Buy ${symbol}`}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={async () => { await removeFromWatchlist(symbol); router.refresh() }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove from watchlist</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>

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
