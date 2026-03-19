'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { BuySellModal } from '@/components/trade/buy-sell-modal'
import { useSimulationDate } from '@/context/simulation-date'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { SymbolAvatar } from '@/components/ui/symbol-avatar'
import { StockDetailSheet } from '@/components/stock/stock-detail-sheet'
import { cn, fmtDate } from '@/lib/utils'
import { executeSell } from '@/lib/actions/trade'

interface PortfolioRowProps {
  symbol: string
  companyName: string
  quantity: number
  avgBuyPrice: number
  openedDate: string
  isFuture?: boolean
  onPriceLoaded?: (symbol: string, price: number) => void
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PortfolioRow({
  symbol,
  companyName,
  quantity,
  avgBuyPrice,
  openedDate,
  isFuture = false,
  onPriceLoaded,
}: PortfolioRowProps) {
  const { simulationDate } = useSimulationDate()
  const router = useRouter()
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [isClosing, startClose] = useTransition()

  const fetchPrice = useCallback(async () => {
    try {
      const dateParam = simulationDate ? `&date=${simulationDate}` : ''
      const res = await fetch(`/api/market/quote?symbol=${symbol}${dateParam}`)
      const data = await res.json()
      if (data?.error || (!data?.close && !data?.price)) return
      const p = parseFloat(data.close ?? data.price)
      if (p > 0) {
        setPrice(p)
        onPriceLoaded?.(symbol, p)
      }
    } finally {
      setLoading(false)
    }
  }, [symbol, simulationDate, onPriceLoaded])

  useEffect(() => {
    setLoading(true)
    fetchPrice()
    if (!simulationDate) {
      const interval = setInterval(fetchPrice, 60_000)
      return () => clearInterval(interval)
    }
  }, [fetchPrice, simulationDate])

  const costBasis    = avgBuyPrice * quantity
  const currentValue = price !== null ? price * quantity : null
  const pnl          = currentValue !== null ? currentValue - costBasis : null
  const pnlPct       = pnl !== null && costBasis > 0 ? (pnl / costBasis) * 100 : null
  const pnlPositive  = pnl !== null ? pnl >= 0 : true

  function handleClose() {
    if (!price) return
    startClose(async () => {
      await executeSell(symbol, companyName, quantity, price, simulationDate)
      router.refresh()
    })
  }

  return (
    <>
      <TableRow className={cn(isFuture && 'opacity-40')}>
        {/* Symbol + name */}
        <TableCell>
          <StockDetailSheet symbol={symbol} companyName={companyName} simulationDate={simulationDate}>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <SymbolAvatar symbol={symbol} size={32} />
              <div>
                <p className="font-semibold text-sm">{symbol}</p>
                <p className="text-xs text-muted-foreground truncate max-w-32">{companyName}</p>
              </div>
            </div>
          </StockDetailSheet>
        </TableCell>

        {/* Current price */}
        <TableCell>
          {loading
            ? <Skeleton className="h-4 w-16" />
            : <span className="font-semibold text-sm tabular-nums">
                {price !== null ? `$${fmt(price)}` : '—'}
              </span>
          }
        </TableCell>

        {/* Units */}
        <TableCell>
          <p className="text-sm font-medium tabular-nums">{quantity.toFixed(6)}</p>
          <p className="text-xs text-muted-foreground">Long</p>
        </TableCell>

        {/* Buy price */}
        <TableCell>
          <span className="text-sm tabular-nums">${fmt(avgBuyPrice)}</span>
        </TableCell>

        {/* Trade Date */}
        <TableCell>
          <span className="text-sm text-muted-foreground tabular-nums">{fmtDate(openedDate)}</span>
        </TableCell>

        {/* P/L */}
        <TableCell>
          {pnl !== null ? (
            <div className={cn('flex items-center gap-1', pnlPositive ? 'text-green-500' : 'text-red-500')}>
              {pnlPositive
                ? <TrendingUp className="h-3 w-3 shrink-0" />
                : <TrendingDown className="h-3 w-3 shrink-0" />
              }
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {pnlPositive ? '+' : ''}${fmt(pnl)}
                </p>
                <p className="text-xs tabular-nums">
                  ({pnlPositive ? '+' : ''}{pnlPct!.toFixed(2)}%)
                </p>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Current value */}
        <TableCell>
          <span className="text-sm font-medium tabular-nums">
            {currentValue !== null ? `$${fmt(currentValue)}` : '—'}
          </span>
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          {!isFuture && (
            <div className="flex items-center justify-end gap-2">
              {/* Close — sell all with confirmation */}
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        className="rounded-full bg-red-600 hover:bg-red-700 text-white h-8 px-4"
                        disabled={loading || isClosing}
                      >
                        {isClosing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Close'}
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Sell entire position</TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Close {symbol} position?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sell all {quantity.toFixed(6)} shares at ${price !== null ? fmt(price) : '—'} per share
                      {price !== null && ` (≈ $${fmt(price * quantity)})`}.
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        onClick={handleClose}
                        disabled={isClosing || price === null}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Yes, sell all
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Trade — buy/partial sell modal */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-full bg-green-600 hover:bg-green-700 text-white h-8 px-4"
                    disabled={loading}
                    onClick={() => setModalOpen(true)}
                  >
                    Trade
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Buy more or partial sell</TooltipContent>
              </Tooltip>
            </div>
          )}
        </TableCell>
      </TableRow>

      {!isFuture && (
        <BuySellModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); router.refresh() }}
          symbol={symbol}
          companyName={companyName}
          price={price ?? avgBuyPrice}
          maxShares={quantity}
        />
      )}
    </>
  )
}
